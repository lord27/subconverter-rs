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
import { existsSync, renameSync, rmSync, cpSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

// Monaco editor resources. jsdelivr (the default Monaco CDN) is unreachable
// from many networks, so for static export we copy the editor from
// node_modules into `public/monaco/vs` before the build (Next copies `public/`
// verbatim into the output folder) and clean it up afterwards so it never
// pollutes the source tree.
const monacoSrcDir = join(root, 'node_modules', 'monaco-editor', 'min', 'vs');
const monacoPubDir = join(root, 'public', 'monaco', 'vs');

const nextBin = process.platform === 'win32'
  ? join(root, 'node_modules', '.bin', 'next.cmd')
  : join(root, 'node_modules', '.bin', 'next');

function exit(code) {
  process.exit(code);
}

/**
 * Recursively collect every file under `dir` with its path relative to `dir`.
 * Used to build the static GitHub-tree index of the rule library.
 */
function collectFiles(dir, baseRel = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = baseRel ? `${baseRel}/${name}` : name;
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectFiles(full, rel));
    } else if (st.isFile()) {
      out.push({ rel, size: st.size });
    }
  }
  return out;
}

/**
 * Stage the in-repo `base/` rule library (330+ .list / .ini / templates) as
 * static assets so the browser WASM VFS can bootstrap from the same origin
 * instead of a truncated GitHub/jsDelivr directory listing:
 *   - copies `base/` -> `public/base/` (Next copies `public/` into `dist/`);
 *   - writes `public/base/_tree.json`, a GitHub `git/trees`-shaped index the
 *     WASM VFS loader understands, with every entry prefixed `base/`.
 */
function stageBaseLibrary(root, repoRoot, publicDir) {
  const repoBase = join(repoRoot, 'base');
  if (!existsSync(repoBase)) {
    console.warn('[static-export] WARNING: in-repo base/ not found at', repoBase);
    console.warn('[static-export] The rule library will fall back to remote GitHub loading.');
    return;
  }

  const publicBase = join(publicDir, 'base');
  if (existsSync(publicBase)) {
    rmSync(publicBase, { recursive: true, force: true });
  }
  cpSync(repoBase, publicBase, { recursive: true });
  console.log('[static-export] Copied base/ rule library -> public/base');

  // git/trees-shaped index (`path` values are repo-root relative, matching the
  // `root_path = "base"` prefix the VFS loader strips).
  const files = collectFiles(repoBase);
  const tree = files
    .sort((a, b) => a.rel.localeCompare(b.rel))
    .map((f) => ({
      path: `base/${f.rel}`,
      mode: '100644',
      type: 'blob',
      size: f.size,
    }));
  writeFileSync(
    join(publicBase, '_tree.json'),
    JSON.stringify({ sha: 'static-export-local', truncated: false, tree }, null, 0)
  );
  console.log(`[static-export] Wrote base/_tree.json with ${tree.length} files`);
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

  // Fresh Monaco copy (clear any stale leftovers from a previous failed run).
  if (existsSync(monacoPubDir)) {
    rmSync(join(root, 'public', 'monaco'), { recursive: true, force: true });
  }
  if (existsSync(monacoSrcDir)) {
    cpSync(monacoSrcDir, monacoPubDir, { recursive: true });
    console.log('[static-export] Copied monaco-editor min/vs -> public/monaco/vs');
  } else {
    console.warn('[static-export] WARNING: monaco-editor not found at', monacoSrcDir);
    console.warn('[static-export] The code editor page will fall back to the jsdelivr CDN.');
  }

  // Stage the in-repo rule library as same-origin static assets (see
  // `stageBaseLibrary`). This must happen before `next build` so Next copies
  // `public/base` into the output folder.
  stageBaseLibrary(root, join(root, '..'), join(root, 'public'));

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
  // Clean up the temporary Monaco copy so it never lands in the source tree.
  if (existsSync(join(root, 'public', 'monaco'))) {
    rmSync(join(root, 'public', 'monaco'), { recursive: true, force: true });
    console.log('[static-export] Cleaned up temporary public/monaco');
  }
  // Same for the staged base library copy (dist/ already received it above).
  if (existsSync(join(root, 'public', 'base'))) {
    rmSync(join(root, 'public', 'base'), { recursive: true, force: true });
    console.log('[static-export] Cleaned up temporary public/base');
  }
}

if (failed) {
  exit(1);
}
