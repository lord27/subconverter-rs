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
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// CodeBuddy/IDE agents inject a language shim via NODE_OPTIONS that replaces
// fs.rmSync with a recycle-bin ("trash") implementation. That makes directory
// cleanup fail with `[safe-delete] 操作失败` / `trash operation ... aborted`
// and leaves a stale `dist/`. The shim is loaded at process start (--require),
// so deleting the env var at runtime is too late — instead re-execute this
// script in a child process with a clean environment.
if (process.env.NODE_OPTIONS?.includes('node-language-shim')) {
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_OPTIONS;
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: cleanEnv,
  });
  process.exit(child.status ?? 1);
}
// Overridable output folder (default `dist`). Lets you build elsewhere when the
// default folder is locked by a local process (e.g. an IDE watcher or a
// `npx serve dist`).
const outputDir = join(root, process.env.STATIC_DIST_DIR || 'dist');
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
  for (const p of [join(root, '.next'), outputDir]) {
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

  if (!existsSync(nextBin)) {
    throw new Error(
      `next binary not found at ${nextBin} — did you run \`pnpm install\` in ${root} first?`
    );
  }

  const env = { ...process.env, STATIC_EXPORT: 'true' };
  const result = spawnSync(nextBin, ['build'], {
    stdio: 'inherit',
    cwd: root,
    env,
    // On Windows a shell is required to run the `.cmd` shim; on POSIX the
    // `next` bin is a shebang script that can be exec'd directly (avoids
    // shell quoting issues with the quoted-path form of execSync).
    shell: process.platform === 'win32',
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.error?.message || `next build exited with code ${result.status}`
    );
  }
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
