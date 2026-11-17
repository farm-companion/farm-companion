import { execFile } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Claude Code CLI transport.
 *
 * Replaces the DeepSeek chat-completions calls. Authentication is a long-lived
 * OAuth token from `claude setup-token`, supplied as CLAUDE_CODE_OAUTH_TOKEN,
 * so these runs bill to the Claude subscription and not to a metered API key.
 *
 * Returns the same { success, content } / { success, error } shape the DeepSeek
 * caller returned, so both generators keep their existing fallback paths.
 */

const BIN = process.env.CLAUDE_BIN || 'claude';
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS) || 120000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// The CLI prints auth and quota failures to stdout rather than stderr, and a
// message like "Not logged in" is short enough to pass the callers' length
// validators and be posted as copy. The exit code is the primary check; this
// is the backstop if a failure ever reaches stdout with the exit code lost.
const FAILURE_TEXT =
  /^(not logged in|login expired|invalid api key|credit balance|api error|usage limit|oauth token|claude code)/i;

let isolatedDir = null;

/**
 * A throwaway config directory, also used as the working directory, keeps this
 * machine's CLAUDE.md, settings, hooks and MCP servers out of a copy prompt.
 */
function workDir() {
  if (!isolatedDir) isolatedDir = mkdtempSync(join(tmpdir(), 'fc-claude-'));
  return isolatedDir;
}

function childEnv() {
  const env = { ...process.env, CLAUDE_CONFIG_DIR: workDir() };
  // In print mode an API key always outranks CLAUDE_CODE_OAUTH_TOKEN, so a
  // stray key in the environment would silently move these runs onto metered
  // API billing. Drop both, leaving the subscription token as the only
  // credential the CLI can find.
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  return env;
}

function runOnce(prompt) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      BIN,
      [
        '--print',
        '--output-format', 'text',
        '--model', MODEL,
        '--allowedTools', '',
        '--strict-mcp-config',
      ],
      { env: childEnv(), cwd: workDir(), timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        const text = String(stdout || '').trim();
        if (error) return reject(new Error(text || error.message));
        if (!text) return reject(new Error('Claude CLI returned no output'));
        if (FAILURE_TEXT.test(text)) return reject(new Error(text));
        resolve(text);
      }
    );
    // Prompt over stdin, so farm data never lands in the process table.
    child.stdin.end(prompt);
  });
}

/**
 * Send one prompt and return its text.
 * @param {string} prompt
 */
export async function callClaude(prompt) {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return {
      success: false,
      error: 'CLAUDE_CODE_OAUTH_TOKEN not configured (generate one with: claude setup-token)',
    };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return { success: true, content: await runOnce(prompt) };
    } catch (error) {
      console.error(`❌ Claude CLI attempt ${attempt} failed: ${error.message}`);

      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          error: `Claude CLI failed after ${MAX_RETRIES} attempts: ${error.message}`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}
