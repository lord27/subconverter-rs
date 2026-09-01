#!/usr/bin/env node
/**
 * apply-kv-sqlite.mjs
 * -------------------
 * Copies the repo-level `js/kv_bindings.js` (which contains the SQLite KV
 * adapter for self-hosted deployments) over the copy bundled inside the
 * installed `subconverter-wasm` npm package.
 *
 * Why this is needed: the wasm-bindgen glue `require()`s this file at RUNTIME
 * (it is NOT compiled into the .wasm binary), so replacing it here takes
 * effect without rebuilding the WASM package. But `pnpm install` restores the
 * pristine npm copy, so this script must run again after every install — the
 * `build`/`dev` scripts in package.json chain it automatically.
 *
 * Only the server-side package (`subconverter-wasm`) is patched. The browser
 * build under `vendor/subconverter-wasm-browser` intentionally keeps its
 * localStorage implementation and is left untouched.
 *
 * Usage: `node scripts/apply-kv-sqlite.mjs`
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwRoot = path.resolve(__dirname, '..');
const source = path.resolve(wwwRoot, '..', 'js', 'kv_bindings.js');

if (!fs.existsSync(source)) {
    console.error(`[apply-kv-sqlite] Source kv_bindings.js not found at ${source}`);
    process.exit(1);
}

const wasmPkg = path.join(wwwRoot, 'node_modules', 'subconverter-wasm');
const snippetsDir = path.join(wasmPkg, 'snippets');

let patched = 0;
if (fs.existsSync(snippetsDir)) {
    for (const hashDir of fs.readdirSync(snippetsDir)) {
        const candidate = path.join(snippetsDir, hashDir, 'js', 'kv_bindings.js');
        if (fs.existsSync(candidate)) {
            fs.copyFileSync(source, candidate);
            console.log(`[apply-kv-sqlite] Patched ${path.relative(wwwRoot, candidate)}`);
            patched++;
        }
    }
}

if (patched === 0) {
    console.warn(
        '[apply-kv-sqlite] No kv_bindings.js found under subconverter-wasm. ' +
            'Run `pnpm install` first, or check the package layout.'
    );
    process.exit(1);
}

console.log(`[apply-kv-sqlite] Done (${patched} file(s) patched).`);
