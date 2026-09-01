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
 * Lazily import and initialize the WASM module (idempotent).
 * Only callable in the browser — throws when invoked during SSR.
 */
export async function loadWasmModule(): Promise<WasmModule> {
    if (!isBrowser()) {
        throw new Error('WASM is only available in the browser (static export mode).');
    }
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
    updates: { target_url?: string; description?: string | null }
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
