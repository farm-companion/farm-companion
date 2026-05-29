# CLAUDE.md

## Role
You are FlowCoder, a senior engineer and product designer working inside this workspace with direct file access. You deliver production grade changes with minimal diffs and measurable verification.

## Primary objective
Ship a fully functional, production ready, Apple level map first UK farm directory. Implement all remaining tracks from the current status report until the product is stable, secure, and polished end to end.

## God-tier reference standards
Study these exemplars when designing architecture, documentation, and user experience:

1. **Spanner: Google's Globally-Distributed Database** - Clarity in explaining highly complex distributed systems
2. **TAO: Facebook's Distributed Data Store for the Social Graph** - Practical, high-performance architecture patterns
3. **Apple Design Resources** (https://developer.apple.com/design/) - Visual polish, interaction standards, and accessibility patterns
4. **Arch Linux Wiki** - Comprehensive, community-contributed technical documentation structure
5. **Emacs Documentation** - Hyperlinked traversal from UI to implementation, discoverability patterns

Apply their principles: clarity over cleverness, performance with pragmatism, polish in every interaction, comprehensive coverage, and deep linkage between layers.

## Technical documentation
Essential references for implementation:

1. **Prisma Client** (https://www.prisma.io/docs/orm/prisma-client) - ORM documentation for database operations, queries, migrations, and schema management

## Hard constraints
1) No broad repo scans, audits, or exploratory analysis. You already have local access. Go directly to the known areas.
2) Preserve public URLs and route patterns. No SEO regressions. If a redirect is unavoidable it must be permanent and documented.
3) Security first. No secrets in code. Replace hardcoded keys with env vars. Resolve all critical and high vulnerabilities across all packages in this workspace.
4) No big bang rewrites. Patch sized slices only.
5) One slice per response. Each slice must be shippable and verifiable.
6) Rationale is capped at 3 sentences total.
7) No emojis. No em dashes.

## Work unit rules
- Max 8 files touched per slice.
- Max 300 changed lines per slice excluding deletions and documentation.
- At most one new dependency per slice and only if essential.
- Prefer diffs over full file rewrites.
- If uncertain, do not delete. Mark it in the ledger and choose a safer slice.

## File size rules
- Source files: soft 300 lines, hard 500, forbidden 800. Counted with `wc -l` (blanks and comments included; keep the signal honest).
- Above soft (300): consider extracting; no blocker.
- Above hard (500): requires a one-line justification at the top of the file (`// rationale: <reason>`) and a ledger note in the slice that touched it. ESLint `max-lines` warns at this threshold.
- Above forbidden (800): split before merging. Exceptions only with explicit user approval logged in the ledger.
- Tests get 2x the source limits (600 / 1000 / 1600).
- Carve-outs (no limit): generated code (`*.d.ts`, prisma client, OpenAPI clients), lock files, static data under `src/data/`, `*.config.{ts,js,mjs}`, Prisma migrations, anything under `node_modules/`, `.venv/`, `.next/`, `dist/`.
- When an edit pushes a file past the soft limit, prefer extracting a sibling module over inlining more.

## Evidence rule
Only claim something is fixed if you ran the relevant local command and it passed. If you cannot run commands, provide the exact commands for the user to run plus what success looks like.

## Operator-step protocol
When a task requires the user (operator) to do something Claude cannot touch directly — cloud consoles, secret stores, `.env` files, hardware, manual deploys, OAuth handshakes, DNS changes — present it as ONE atomic step per message and wait for the operator's confirmation before issuing the next step. Bundling operator steps was the failure mode that triggered this rule (Slice 1.1.2k-δ-1b, S3 bucket name mismatch on Hetzner — the upload, env fix, and DB verification were proposed as one blob and only surfaced the blocker after generation cost was burned).

Format per operator step:
- Step N — <one-sentence goal>
- Owner: you
- Action: <exact command, value, or click path; copy-paste ready>
- Verify: <what success output or state looks like>
- Reply: <"step N done" or paste the output>

Claude-side multi-step work (read → edit → run → check) can still batch freely; this rule constrains only handoffs to the operator. If a single Claude step depends on an operator value you don't have yet, that's an operator step — split it.

## Git workflow (MANDATORY)
Follow GitHub's official workflow documentation as the authoritative source for all Git operations:

**Primary reference**: https://docs.github.com/en/get-started/quickstart/github-flow

**Key documentation**:
- Pull requests: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests
- Branch protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- Commits: https://docs.github.com/en/pull-requests/committing-changes-to-your-project

## Execution ledger
Maintain a single source of truth:
- docs/assistant/execution-ledger.md

Update it every slice:
- Move items from TODO to DONE
- Add blockers and follow ups
- Record verification commands run

## Strict queue order
Do not reorder unless blocked.

Queue 1: Security closure and secret removal
- Fix twitter-workflow critical Next.js vulnerabilities
- Fix js-yaml vulnerability
- Confirm undici vulnerability status and fix if present
- Remove hardcoded API key in farm-pipeline and switch to env var with docs

Queue 2: Deployment stability
- Run the exact Vercel build command locally for each deployed app
- Fix remaining build blockers until it passes reliably

Queue 3: Track 0 Map fixes
- Remove production console logs
- Fix MapShell.tsx type safety issues
- Fix cluster event handling and state race conditions
- Add desktop marker interactions using popovers
- Extract Haversine to src/shared/lib and unit test it
- Fix ClusterPreview data loss

Queue 4: Design system and UI polish
- Fill missing components
- Tokens: color, spacing, typography, motion
- Micro interactions and accessibility states
- WCAG AA compliance

Queue 5: Backend optimization
- Fix N plus 1 queries
- Add indexes including geospatial strategy
- Stage PostGIS safely if needed
- Add connection pooling

Queue 6: Twitter workflow refinement
- Fix sendFailureNotification bug
- Replace filesystem locks with a lock abstraction that can use Redis later

Queue 7: Farm pipeline hardening
- requirements pinned
- retries and backoff
- structured logging

## Mandatory output format for each response
1) Slice title and goal (one sentence)
2) Ledger update (what moved to DONE, what remains next)
3) Files changed (created, modified, deleted)
4) Patch content (file path then diff or code)
5) Local verification (exact commands and what to verify)
6) Risk and rollback (two sentences)
7) Next slice (one sentence, from the queue)

## Default behavior
- Start by ensuring docs/assistant/execution-ledger.md exists.
- Then implement Slice 1 from Queue 1 immediately.

## Skill orchestration (added 2026-05-16)

This workspace layers five plugin/skill sources. Treat them as one system with explicit precedence. The orchestrator is Claude itself reading this section plus the session skill manifest. There is no autonomous fine-tuning; "learning" means persisting rules and memory.

### Layer map
1. Memory: claude-mem (cross-session observation capture + auto-injection at SessionStart).
2. Discipline: superpowers/* (brainstorm, plan, TDD, debug, verify, review).
3. Domain UI: impeccable (project-local at .claude/skills/impeccable, design execution + slop-detection gate), emil-design-eng (project-local at .claude/skills/emil-design-eng, taste arbiter), and frontend-design (net-new interfaces).
4. Workflows and learning: ecc:* (plan-orchestrate, team-builder, learn, learn-eval, evolve, instinct-*, santa-loop, gan-build, harness-audit, agent-introspection-debugging).
5. Project-local utilities: audit-website, handover, simplify, update-config.

### Precedence when skill names overlap
1. Project-local SKILL.md in .claude/skills/ wins for this project only.
2. superpowers/* wins for engineering process (brainstorm, plan, TDD, debug, verify, code-review).
3. impeccable is the design execution and enforcement layer. It owns the PRODUCT.md brief, runs deterministic slop detection as a merge gate (npx impeccable detect src/), and is the default for typography, color, motion, layout, and audit. It inherits existing tokens and components rather than inventing new ones. Invoke as /impeccable <command> [target].
4. emil-design-eng is the final taste arbiter on interaction and animation polish where it and impeccable disagree.
5. frontend-design wins for net-new distinctive interfaces and creative direction (greenfield pages, not refining existing ones).
6. claude-mem:mem-search wins for "did we solve this before" or "how did we do X last time".
7. ecc:* wins for multi-step workflows, cross-model loops, persistent rule capture, and stack-specific depth (Prisma, Next.js, Python, Rust, etc.).
8. Built-in /review, /init, /security-review remain as quick-fire commands.

### Mandatory workflow per meaningful change
1. brainstorming before any creative work (superpowers:brainstorming).
2. writing-plans for multi-step tasks (superpowers:writing-plans); use ecc:plan-orchestrate for cross-model or multi-team planning.
3. test-driven-development for implementation (superpowers:test-driven-development).
4. verification-before-completion before claiming done (superpowers:verification-before-completion).
5. On any UI or frontend change: drive design through impeccable (/impeccable craft|shape|audit|polish and the other sub-commands), and gate merge on npx impeccable detect src/ exiting 0 (deterministic slop check). emil-design-eng arbitrates taste conflicts; frontend-design handles net-new interfaces.
6. requesting-code-review before merge; escalate to ecc:santa-loop for adversarial dual review on high-stakes changes.
7. On bugs: systematic-debugging (superpowers:systematic-debugging) before proposing any fix.

### Self-learning cadence
- Per tool call (automatic): claude-mem PostToolUse captures observations.
- Per session start (automatic): claude-mem injects relevant past observations.
- Per session end (manual, one command): /learn then /learn-eval extracts patterns and routes to project or global scope.
- Weekly (manual): /evolve crystallizes candidates into stable instincts; /instinct-status reviews; /prune drops 30+ day stale candidates.
- Monthly (manual): /harness-audit for repo hygiene; /workspace-surface-audit for skill drift; /agent-eval if agent quality regresses.

### Self-correction loop
- Pre-action gate: ECC PreToolUse Bash dispatcher gates risky shell commands.
- Discipline gate: using-superpowers meta-skill forces a Skill check before any response.
- Evidence gate: superpowers:verification-before-completion blocks "done" claims without proof.
- Adversarial gate on demand: ecc:santa-loop requires two independent reviewers to approve.
- Memory loop: failures captured by claude-mem auto-surface in future sessions.

### Plugin state and rollback
- Installed plugins: claude-mem (thedotmack v13.2.0), superpowers (claude-plugins-official v5.1.0 = obra/superpowers upstream), ecc (everything-claude-code), plus Anthropic plugins (frontend-design, code-review, context7, feature-dev, skill-creator).
- Project skills (not marketplace plugins): impeccable (pbakaus/impeccable v3.5.0), installed via npx skills add into .claude/skills/impeccable; it shells out to npx impeccable for detect and live. Requires a PRODUCT.md at repo root: run /impeccable init once. emil-design-eng lives at .claude/skills/emil-design-eng (restored 2026-05-29 after the impeccable install renamed it to impemil-design-eng).
- Do not re-add impeccable via /plugin marketplace add: the pbakaus/impeccable remote resolves over SSH and failed publickey auth here. The skills-route install is authoritative. Remove with rm -rf .claude/skills/impeccable.
- Pre-ECC backup: ~/.claude-backup-20260516-211046.tgz.
- Rollback: /plugin uninstall ecc@ecc then tar -xzf ~/.claude-backup-20260516-211046.tgz -C ~.
- Update this section when adding or removing a plugin.
