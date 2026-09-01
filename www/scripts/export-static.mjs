/**
 * export-static.mjs
 * -----------------
 * Builds the app in pure static export mode (`output: 'export'`).
 *
 * Next.js does not support Route Handlers with `output: 'export'`, so the
 * serverless `src/app/api` directory is temporarily moved aside before
 * `next build` and restored afterwards.
 *
 * Usage:
 *   npm run build:static     (or: node scripts/export-static.mjs)
 *
 * Output: `dist/` — a fully static folder that can be hosted anywhere.
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const apiDir = join(root, 'src', 'app', 'api');
// IMPORTANT: the backup must live OUTSIDE src/app, otherwise Next.js treats it
// as an app-route directory and tries to collect the API routes.
const backupDir = join(root, 'api.backup');

const nextBin = process.platform === 'win32'
  ? join(root, 'node_modules', '.bin', 'next.cmd')
  : join(root, 'node_modules', '.bin', 'next');

function exit(code) {
  process.exit(code);
}

let failed = false;

try {
  // Fresh output folders avoid stale state from previous builds.
  for (const p of [join(root, '.next'), join(root, 'dist')]) {
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }

  if (existsSync(apiDir)) {
    if (existsSync(backupDir)) {
      console.error('[static-export] ERROR: stale backup directory exists:', backupDir);
      console.error('[static-export] Move or delete it manually, then retry.');
      exit(1);
    }
    renameSync(apiDir, backupDir);
    console.log('[static-export] Temporarily moved src/app/api -> api.backup');
  }

  const env = { ...process.env, STATIC_EXPORT: 'true' };
  execSync(`"${nextBin}" build`, {
    stdio: 'inherit',
    cwd: root,
    env,
    shell: process.platform === 'win32',
  });
} catch (err) {
  console.error('[static-export] Build failed:', err?.message || err);
  failed = true;
} finally {
  if (existsSync(backupDir)) {
    renameSync(backupDir, apiDir);
    console.log('[static-export] Restored src/app/api');
  }
}

if (failed) {
  exit(1);
}
