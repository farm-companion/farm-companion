#!/usr/bin/env node

/**
 * Fix for Prisma ESM/CommonJS compatibility issue with zeptomatch
 * This script patches @prisma/dev to use dynamic import instead of require
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findPrismaDevPath() {
  try {
    // Try to find @prisma/dev in node_modules using find command
    const result = execSync(
      'find node_modules/.pnpm -path "*/@prisma/dev/dist/index.cjs" 2>/dev/null | head -1',
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    ).trim();

    if (result && fs.existsSync(path.join(__dirname, '..', result))) {
      return path.join(__dirname, '..', result);
    }
  } catch (e) {
    console.log('Find command failed, trying fallback methods...');
  }

  // Fallback: use glob-like pattern search
  try {
    const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm');
    if (fs.existsSync(pnpmDir)) {
      const dirs = fs.readdirSync(pnpmDir);
      for (const dir of dirs) {
        if (dir.startsWith('@prisma+dev@')) {
          const indexPath = path.join(pnpmDir, dir, 'node_modules/@prisma/dev/dist/index.cjs');
          if (fs.existsSync(indexPath)) {
            return indexPath;
          }
        }
      }
    }
  } catch (e) {
    console.log('Fallback search failed:', e.message);
  }

  return null;
}

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Pattern 1: Le=w(require("zeptomatch"),1),
  content = content.replace(
    /(\w+)=w\(require\("zeptomatch"\),1\)/g,
    (match, varName) => {
      // Find the lazy loader function and make it async
      const lazyLoaderPattern = new RegExp(
        `var[^;]*${varName}[^;]*W=D\\(\\(\\)=>\\{"use strict"`,
        'g'
      );
      content = content.replace(
        lazyLoaderPattern,
        (match) => match.replace('D(()=>', 'D(async()=>')
      );
      return `${varName}=w((await import("zeptomatch")).default,1)`;
    }
  );
  
  // Pattern 2: Be=u(require("zeptomatch"),1),
  content = content.replace(
    /(\w+)=u\(require\("zeptomatch"\),1\)/g,
    (match, varName) => {
      // Find the lazy loader function and make it async
      const lazyLoaderPattern = new RegExp(
        `var[^;]*${varName}[^;]*z=D\\(\\(\\)=>\\{"use strict"`,
        'g'
      );
      content = content.replace(
        lazyLoaderPattern,
        (match) => match.replace('D(()=>', 'D(async()=>')
      );
      return `${varName}=u((await import("zeptomatch")).default,1)`;
    }
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Patched ${filePath}`);
    return true;
  } else {
    console.log(`No changes needed for ${filePath}`);
    return false;
  }
}

// Main execution - patch ALL instances
function findAllPrismaDevPaths() {
  const paths = [];
  try {
    const result = execSync(
      'find node_modules/.pnpm -path "*/@prisma/dev/dist/index.cjs" 2>/dev/null',
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    );

    const lines = result.trim().split('\n').filter(line => line);
    for (const line of lines) {
      const fullPath = path.join(__dirname, '..', line);
      if (fs.existsSync(fullPath)) {
        paths.push(fullPath);
      }
    }
  } catch (e) {
    console.log('Find command failed, trying fallback...');
  }

  // Fallback
  if (paths.length === 0) {
    try {
      const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm');
      if (fs.existsSync(pnpmDir)) {
        const dirs = fs.readdirSync(pnpmDir);
        for (const dir of dirs) {
          if (dir.startsWith('@prisma+dev@')) {
            const indexPath = path.join(pnpmDir, dir, 'node_modules/@prisma/dev/dist/index.cjs');
            if (fs.existsSync(indexPath)) {
              paths.push(indexPath);
            }
          }
        }
      }
    } catch (e) {
      console.log('Fallback search failed:', e.message);
    }
  }

  return paths;
}

const indexPaths = findAllPrismaDevPaths();
if (indexPaths.length > 0) {
  console.log(`Found ${indexPaths.length} @prisma/dev installation(s)`);
  let patchedCount = 0;
  for (const indexPath of indexPaths) {
    if (patchFile(indexPath)) {
      patchedCount++;
    }
  }
  console.log(`Patched ${patchedCount} file(s)`);
} else {
  console.log('Could not find any @prisma/dev/dist/index.cjs');
  process.exit(1);
}
