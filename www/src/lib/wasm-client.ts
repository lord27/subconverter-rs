/**
 * wasm-client.ts
 * -----------------
 * Browser-side direct client for the subconverter WASM module.
 *
 * Used in pure static export mode (`STATIC_EXPORT=true`, `output: 'export'`)
 * where the serverless API routes are not available. All conversion, file,
 * short-URL and rules operations run entirely inside the browser via the
 * `subconverter-wasm-browser` WebAssembly module (wasm-pack `--target web`,
 * bundled under `www/vendor/subconverter-wasm-browser`).
 *
 * The module is loaded lazily (dynamic import) so that server-side rendering
 * during the static build never touches WebAssembly.
 */
import type { DirectoryEntry, FileAttributes } from 'subconverter-wasm';

type WasmModule = typeof import('subconverter-wasm-browser');

/* ==================== Lazy module loading ==================== */

let modulePromise: Promise<WasmModule> | null = null;

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Rewrites GitHub-hosted GET requests made by the WASM VFS so they work from a
 * browser in pure static export:
 *
 *  1. `raw.githubusercontent.com/{owner}/{repo}/{branch}/base/{path}` (file
 *     reads of the rule library) -> same-origin `/base/{path}` first (static
 *     export ships a copy of the repo's `base/`), falling back to
 *     `cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}`. jsDelivr has no
 *     unauthenticated rate limit and sends CORS headers, unlike GitHub's raw /
 *     Contents API which quickly 403s an anonymous browser session.
 *  2. `api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
 *     (directory listing used by `initialize_subconverter_webapp`)
 *     -> same-origin `/base/_tree.json` first (a git/trees-shaped index of the
 *     in-repo library generated at build time; the GitHub API truncates this
 *     repo and jsDelivr's flat listing is capped for large repos), falling back
 *     to `data.jsdelivr.com/v1/packages/gh/{owner}/{repo}@{branch}?structure=flat`,
 *     converted back into the GitHub `git/trees` JSON shape the WASM expects.
 *
 * Each rewrite falls back to the original URL (then to the GitHub Contents API
 * for file reads) when the proxy fails, so a CDN hiccup never hard-fails VFS
 * operations.
 */
let githubFetchPatched = false;

/**
 * Purges a poisoned GitHub tree cache entry left behind by the old
 * jsDelivr-based directory loader. jsDelivr's flat listing is *capped* for
 * this repository and returns no `base/` files at all, yet the 200 response is
 * cached in KV for the whole 15-minute TTL — a stale entry keeps startup
 * stuck at "Found 0 files". A tree response without a single `"base/` path can
 * never be valid for `root_path = "base"`, so such entries are safe to drop.
 */
function purgeStaleGitHubTreeCache(): void {
    try {
        if (typeof localStorage === 'undefined') return;
        const PREFIX = 'subconverter_kv_v1_';
        for (let i = 0; i < localStorage.length; i++) {
            const lsKey = localStorage.key(i);
            if (!lsKey || !lsKey.startsWith(PREFIX)) continue;
            if (!lsKey.includes('@@github_tree_cache')) continue;
            if (!lsKey.includes('lonelam/subconverter-rs')) continue;
            try {
                const raw = localStorage.getItem(lsKey);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                const data =
                    parsed &&
                    typeof parsed === 'object' &&
                    '__t' in parsed &&
                    parsed.__t === 'j' &&
                    parsed.d &&
                    typeof parsed.d.data === 'string'
                        ? parsed.d.data
                        : '';
                if (!data.includes('"base/')) {
                    localStorage.removeItem(lsKey);
                    console.warn(`[github-rewrite] Purged stale GitHub tree cache: ${lsKey}`);
                }
            } catch {
                /* leave unparsable entries untouched */
            }
        }
    } catch {
        /* localStorage unavailable — ignore */
    }
}

// GitHub Contents API URL for a raw file path (used as a second fallback for
// file reads — more networks reach it than raw.githubusercontent.com).
function githubContentsUrl(owner: string, repo: string, branch: string, path: string): string {
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
    return (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
}

function getUrlString(input: RequestInfo | URL): string {
    return typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.href
            : (input as Request).url;
}

function installGitHubFetchRewrite(): void {
    if (githubFetchPatched || typeof window === 'undefined') return;
    // Drop any stale tree cache from the old loader *before* the WASM VFS
    // consults it, otherwise startup would keep failing for the whole TTL.
    purgeStaleGitHubTreeCache();
    githubFetchPatched = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlStr = getUrlString(input);
        const method = getRequestMethod(input, init);
        if (method !== 'GET') return originalFetch(input, init);

        // --- 1) Raw file reads: raw.githubusercontent.com -> local copy -> jsDelivr CDN ---
        const rawMatch = urlStr.match(
            /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/
        );
        if (rawMatch) {
            const [, owner, repo, branch, path] = rawMatch;

            // Static export ships `base/` from the in-repo rule library under
            // `/base/*`. Same-origin reads are fast, offline-capable and never
            // hit CDN limits, so try the local copy first.
            if (path.startsWith('base/')) {
                const localUrl = `${window.location.origin}/base/${path.slice('base/'.length)}`;
                try {
                    const response = await originalFetch(localUrl, init);
                    if (response.ok) return response;
                    console.warn(
                        `[github-rewrite] Local base copy returned ${response.status}, trying jsDelivr`,
                        localUrl
                    );
                } catch (err) {
                    console.warn('[github-rewrite] Local base copy failed, trying jsDelivr:', err);
                }
            }

            const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${encodeURIComponent(branch)}/${path}`;
            try {
                const response = await originalFetch(jsdelivrUrl, init);
                if (response.ok) return response;
                console.warn(
                    `[github-rewrite] jsDelivr returned ${response.status}, trying Contents API`,
                    jsdelivrUrl
                );
            } catch (err) {
                console.warn('[github-rewrite] jsDelivr fetch failed, trying Contents API:', err);
            }
            // Fallback: GitHub Contents API with `Accept: application/vnd.github.raw+json`
            // (`Accept` is CORS-safelisted, so no preflight).
            const apiUrl = githubContentsUrl(owner, repo, branch, path);
            const headers = new Headers(
                init?.headers ?? (input instanceof Request ? input.headers : undefined)
            );
            headers.set('Accept', 'application/vnd.github.raw+json');
            try {
                const response = await originalFetch(apiUrl, { ...init, headers });
                if (response.ok) return response;
                console.warn(
                    `[github-rewrite] Contents API returned ${response.status}, falling back to raw URL`,
                    apiUrl
                );
            } catch (err) {
                console.warn('[github-rewrite] Contents API fetch failed, falling back to raw URL:', err);
            }
            return originalFetch(input, init);
        }

        // --- 2) Directory listing: api.github.com git/trees -> local index -> jsDelivr data API ---
        const treeMatch = urlStr.match(
            /^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/git\/trees\/([^/?]+)/
        );
        if (treeMatch) {
            const [, owner, repo, branch] = treeMatch;

            // Static export generates `_tree.json` (a git/trees-shaped index of
            // the in-repo `base/` library). GitHub's own trees API truncates
            // this repository and jsDelivr's flat listing is capped for large
            // repos, so the local index is the only reliable full listing.
            const localTreeUrl = `${window.location.origin}/base/_tree.json`;
            try {
                const response = await originalFetch(localTreeUrl);
                if (response.ok) return response;
                console.warn(
                    `[github-rewrite] Local tree index returned ${response.status}, trying jsDelivr data API`,
                    localTreeUrl
                );
            } catch (err) {
                console.warn('[github-rewrite] Local tree index fetch failed, trying jsDelivr data API:', err);
            }

            const dataUrl = `https://data.jsdelivr.com/v1/packages/gh/${owner}/${repo}@${encodeURIComponent(branch)}?structure=flat`;
            try {
                const response = await originalFetch(dataUrl);
                if (response.ok) {
                    const json = await response.json();
                    // jsDelivr flat listing: `files` entries carry the full
                    // relative path in `name` and `type` of "file"/"directory".
                    const tree = (json.files ?? []).map((f: any) => {
                        const entry: Record<string, unknown> = {
                            path: f.name,
                            type: f.type === 'directory' ? 'tree' : 'blob',
                        };
                        if (typeof f.size === 'number') entry.size = f.size;
                        return entry;
                    });
                    const body = JSON.stringify({ tree, truncated: false });
                    return new Response(body, {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                console.warn(
                    `[github-rewrite] jsDelivr data API returned ${response.status}, falling back to GitHub API`,
                    dataUrl
                );
            } catch (err) {
                console.warn('[github-rewrite] jsDelivr data API fetch failed, falling back to GitHub API:', err);
            }
            return originalFetch(input, init);
        }

        return originalFetch(input, init);
    };
}

/**
 * Lazily import and initialize the WASM module (idempotent).
 * Only callable in the browser — throws when invoked during SSR.
 */
export async function loadWasmModule(): Promise<WasmModule> {
    if (!isBrowser()) {
        throw new Error('WASM is only available in the browser (static export mode).');
    }
    // Ensure GitHub raw fetches are rewritten before any WASM code runs.
    installGitHubFetchRewrite();
    if (!modulePromise) {
        modulePromise = (async () => {
            const mod = await import('subconverter-wasm-browser');
            // `default` is the wasm-bindgen `__wbg_init` (fetches + instantiates
            // the .wasm file and runs `__wbindgen_start`).
            if (typeof mod.default === 'function') {
                await mod.default();
            }
            if (typeof mod.init_panic_hook === 'function') {
                mod.init_panic_hook();
            }
            if (typeof mod.admin_init_kv_bindings_js === 'function') {
                mod.admin_init_kv_bindings_js();
            }
            if (typeof mod.init_wasm_logging === 'function') {
                try {
                    mod.init_wasm_logging('info');
                } catch {
                    /* non-fatal */
                }
            }
            return mod;
        })().catch((err) => {
            modulePromise = null; // allow retry on next call
            throw err;
        });
    }
    return modulePromise;
}

/** Alias kept for backwards compatibility with the rest of the app. */
export function ensureWasmInitialized(): Promise<WasmModule> {
    return loadWasmModule();
}

/* ==================== Error helpers ==================== */

/**
 * Normalize errors thrown by WASM functions (they may reject with a plain
 * string, a JSON string like `{"type":"NotFound","message":"..."}`, or an
 * Error object) into a friendly Error.
 */
function normalizeError(e: any): Error {
    if (e instanceof Error) return e;
    if (typeof e === 'string') {
        try {
            const parsed = JSON.parse(e);
            if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
                return new Error(parsed.message);
            }
        } catch {
            /* not JSON, fall through */
        }
        return new Error(e);
    }
    return new Error(String(e));
}

/* ==================== Types (mirror server API) ==================== */

export interface WasmSubResponse {
    content: string;
    content_type: string;
    headers: Record<string, string>;
    status_code: number;
}

export interface WasmRulesUpdateResult {
    success: boolean;
    message: string;
    details: Record<string, { repo_name: string; files_updated: string[]; errors: string[]; status: string }>;
}

export interface WasmShortUrlData {
    id: string;
    target_url: string;
    short_url: string;
    params?: Record<string, unknown>;
    endpoint_id?: string;
    created_at: number;
    last_used?: number;
    use_count: number;
    custom_id: boolean;
    description?: string;
}

interface PlatformConfig {
    repo: string;
    asset_pattern: string;
    fallback_url: string;
}

interface AppDownload {
    name: string;
    description: string;
    platforms: Record<string, PlatformConfig>;
}

const DOWNLOADS_CACHE_FILE = 'downloads/available_downloads.json';

// Default recommended downloads (mirrors www/src/app/api/downloads/route.ts)
const DEFAULT_DOWNLOADS: AppDownload[] = [
    {
        name: 'Clash Verge',
        description: 'A modern GUI client based on Tauri for Windows and macOS',
        platforms: {
            windows: {
                repo: 'clash-verge-rev/clash-verge-rev',
                asset_pattern: '.*_x64-setup\\.exe$',
                fallback_url: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.2.3/Clash.Verge_2.2.3_x64-setup.exe'
            },
            macos: {
                repo: 'clash-verge-rev/clash-verge-rev',
                asset_pattern: '.*_aarch64\\.dmg$',
                fallback_url: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.2.3/Clash.Verge_2.2.3_aarch64.dmg'
            },
            linux: {
                repo: 'clash-verge-rev/clash-verge-rev',
                asset_pattern: '.*_amd64\\.deb$',
                fallback_url: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.2.3/Clash.Verge_2.2.3_arm64.deb'
            }
        }
    },
    {
        name: 'Clash Meta for Android',
        description: 'A rule-based tunnel for Android based on Clash Meta',
        platforms: {
            android: {
                repo: 'MetaCubeX/ClashMetaForAndroid',
                asset_pattern: '.*-universal-release\\.apk$',
                fallback_url: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/latest/download/cmfa-2.11.8-meta-universal-release.apk'
            }
        }
    }
];

/* ==================== Subscription conversion ==================== */

export async function wasmConvertSubscription(params: Record<string, unknown>): Promise<WasmSubResponse> {
    const wasm = await loadWasmModule();
    try {
        const responseJson = await wasm.sub_process_wasm(JSON.stringify(params));
        const data = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
        return {
            content: data.content ?? '',
            content_type: data.content_type ?? 'text/plain',
            headers: data.headers ?? {},
            status_code: data.status_code ?? 200
        };
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmInitSettings(prefPath: string = ''): Promise<boolean> {
    const wasm = await loadWasmModule();
    try {
        return await wasm.init_settings_wasm(prefPath);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmInitializeWebApp(): Promise<{ success: boolean; githubLoadTriggered: boolean; message: string }> {
    const wasm = await loadWasmModule();
    try {
        const triggered = await wasm.initialize_subconverter_webapp();
        return {
            success: true,
            githubLoadTriggered: triggered === true,
            message: triggered
                ? 'VFS initialized, GitHub load was triggered.'
                : 'VFS already initialized or GitHub load not needed.'
        };
    } catch (e) {
        throw normalizeError(e);
    }
}

/* ==================== VFS file operations ==================== */

export async function wasmReadFile(path: string): Promise<string> {
    const wasm = await loadWasmModule();
    try {
        return await wasm.admin_read_file(path);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmWriteFile(path: string, content: string): Promise<void> {
    const wasm = await loadWasmModule();
    try {
        await wasm.admin_write_file(path, content);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmDeleteFile(path: string): Promise<void> {
    const wasm = await loadWasmModule();
    try {
        await wasm.admin_delete_file(path);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmCheckFileExists(path: string): Promise<boolean> {
    const wasm = await loadWasmModule();
    try {
        return await wasm.admin_file_exists(path);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmGetFileAttributes(path: string): Promise<FileAttributes> {
    const wasm = await loadWasmModule();
    try {
        return await wasm.admin_get_file_attributes(path);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmCreateDirectory(path: string): Promise<void> {
    const wasm = await loadWasmModule();
    try {
        await wasm.admin_create_directory(path);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmListDirectory(path: string = ''): Promise<{ path: string; entries: DirectoryEntry[] }> {
    const wasm = await loadWasmModule();
    try {
        const entries = await wasm.list_directory(path);
        return { path, entries: entries ?? [] };
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmLoadGitHubDirectory(
    path: string,
    shallow: boolean = true,
    recursive: boolean = true
): Promise<unknown> {
    const wasm = await loadWasmModule();
    try {
        const fn = recursive
            ? wasm.admin_load_github_directory
            : wasm.admin_load_github_directory_flat;
        return await fn(path, shallow);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmUpdateRules(configPath?: string): Promise<WasmRulesUpdateResult> {
    const wasm = await loadWasmModule();
    try {
        const body = await wasm.admin_update_rules(configPath ?? null);
        return typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
        throw normalizeError(e);
    }
}

/* ==================== Short URL operations ==================== */

function getOrigin(): string {
    return typeof window !== 'undefined' ? window.location.origin : '';
}

export async function wasmCreateShortUrl(request: {
    target_url: string;
    params?: Record<string, unknown>;
    endpoint_id?: string;
    custom_id?: string;
    description?: string;
}): Promise<WasmShortUrlData> {
    const wasm = await loadWasmModule();
    try {
        const responseJson = await wasm.short_url_create(JSON.stringify(request), getOrigin());
        return typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmListShortUrls(): Promise<WasmShortUrlData[]> {
    const wasm = await loadWasmModule();
    try {
        const responseJson = await wasm.short_url_list();
        const data = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
        const origin = getOrigin();
        const urls: WasmShortUrlData[] = data.urls ?? [];
        return urls.map((u) => ({
            ...u,
            short_url: u.short_url.startsWith('http') ? u.short_url : `${origin}${u.short_url}`
        }));
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmDeleteShortUrl(id: string): Promise<void> {
    const wasm = await loadWasmModule();
    try {
        await wasm.short_url_delete(id);
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmUpdateShortUrl(
    id: string,
    updates: { target_url?: string; params?: Record<string, unknown> | null; endpoint_id?: string | null; description?: string | null }
): Promise<WasmShortUrlData> {
    const wasm = await loadWasmModule();
    try {
        const responseJson = await wasm.short_url_update(id, JSON.stringify(updates));
        return typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
    } catch (e) {
        throw normalizeError(e);
    }
}

export async function wasmMoveShortUrl(id: string, newId: string): Promise<WasmShortUrlData> {
    const wasm = await loadWasmModule();
    try {
        const responseJson = await wasm.short_url_move(id, newId, getOrigin());
        return typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
    } catch (e) {
        throw normalizeError(e);
    }
}

/* ==================== Downloads cache (stored in WASM VFS) ==================== */

async function readDownloadsCache(): Promise<AppDownload[] | null> {
    try {
        const exists = await wasmCheckFileExists(DOWNLOADS_CACHE_FILE);
        if (!exists) return null;
        const cacheData = await wasmReadFile(DOWNLOADS_CACHE_FILE);
        const parsed = JSON.parse(cacheData);
        if (Array.isArray(parsed.downloads) && parsed.downloads.length > 0) {
            return parsed.downloads;
        }
        return null;
    } catch (e) {
        console.error('Error reading downloads cache:', e);
        return null;
    }
}

async function writeDownloadsCache(downloads: AppDownload[]): Promise<void> {
    try {
        const dirExists = await wasmCheckFileExists('downloads');
        if (!dirExists) {
            await wasmCreateDirectory('downloads');
        }
        const cacheData = {
            timestamp: Math.floor(Date.now() / 1000),
            downloads
        };
        await wasmWriteFile(DOWNLOADS_CACHE_FILE, JSON.stringify(cacheData, null, 2));
    } catch (e) {
        console.error('Error writing downloads cache:', e);
    }
}

export interface WasmAppDownloadInfo {
    name: string;
    version: string;
    platform: string;
    size: number;
    download_url: string;
    release_date: string;
    description: string;
}

export async function wasmGetAvailableDownloads(): Promise<WasmAppDownloadInfo[]> {
    let downloads = await readDownloadsCache();
    if (!downloads) {
        downloads = DEFAULT_DOWNLOADS;
        await writeDownloadsCache(DEFAULT_DOWNLOADS);
    }
    return downloads.flatMap((app) =>
        Object.entries(app.platforms).map(([platform, config]) => ({
            name: app.name,
            version: 'latest',
            platform,
            size: 0,
            // In static mode point straight at the release asset instead of /api/...
            download_url: config.fallback_url,
            release_date: new Date().toISOString().split('T')[0],
            description: app.description
        }))
    );
}

export async function wasmGetDownloadConfigs(): Promise<AppDownload[]> {
    const downloads = await readDownloadsCache();
    return downloads ?? DEFAULT_DOWNLOADS;
}

export async function wasmUpdateDownloadConfigs(downloads: AppDownload[]): Promise<boolean> {
    try {
        await writeDownloadsCache(downloads);
        return true;
    } catch (e) {
        console.error('Error updating downloads config:', e);
        return false;
    }
}
