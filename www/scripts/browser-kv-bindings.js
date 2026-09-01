/**
 * kv_bindings.js — Browser edition (pure static export)
 * ----------------------------------------------
 * Browser-only KV bindings for the subconverter WASM module.
 *
 * Unlike the server edition (Vercel KV / Netlify Blobs / Node fallback),
 * this edition:
 *   - has NO Node.js / server dependencies (works in any browser bundle),
 *   - persists data in `localStorage` (key prefix `subconverter_kv_v1_`)
 *     with an in-memory Map cache as the fast path,
 *   - falls back gracefully when localStorage is unavailable (private mode,
 *     quota exceeded, SSR), degrading to in-memory only.
 *
 * NOTE: this file is an ESM module — the wasm-bindgen `--target web` glue
 * imports it via ESM `import { ... }`.
 */

const CURRENT_STORAGE_VERSION = 1; // Increment when making breaking changes
const STORAGE_PREFIX = `subconverter_kv_v${CURRENT_STORAGE_VERSION}_`;

// In-memory fallback / fast-path cache
const localStorageMap = new Map();

// Environment variable cache to avoid repeated lookups
const envCache = new Map();

function getenv(name, defaultValue = "") {
    if (envCache.has(name)) return envCache.get(name);
    let value = defaultValue;
    try {
        if (typeof process !== 'undefined' && process.env && name in process.env) {
            value = process.env[name];
        } else if (typeof window !== 'undefined' && window.__ENV__ && name in window.__ENV__) {
            value = window.__ENV__[name];
        }
    } catch (error) {
        console.warn(`Error reading environment variable ${name}:`, error);
    }
    envCache.set(name, value);
    return value;
}

/* ---------- localStorage persistence helpers ---------- */

function serialize(value) {
    if (value instanceof Uint8Array) return { __t: 'b', d: Array.from(value) };
    if (typeof value === 'string') return { __t: 's', d: value };
    return { __t: 'j', d: value };
}

function deserialize(obj) {
    if (obj && typeof obj === 'object' && '__t' in obj) {
        if (obj.__t === 'b') return new Uint8Array(obj.d);
        if (obj.__t === 's') return obj.d;
        return obj.d;
    }
    return obj;
}

function storageGet(key) {
    try {
        if (typeof localStorage === 'undefined') return undefined;
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return undefined;
        return deserialize(JSON.parse(raw));
    } catch {
        return undefined;
    }
}

function storageSet(key, value) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(serialize(value)));
    } catch (error) {
        // Quota exceeded / private mode — degrade to in-memory only.
        console.warn(`localStorage write failed for ${key}:`, error);
    }
}

function storageRemove(key) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
        /* ignore */
    }
}

function storageKeys() {
    const keys = [];
    try {
        if (typeof localStorage === 'undefined') return keys;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) {
                keys.push(k.slice(STORAGE_PREFIX.length));
            }
        }
    } catch {
        /* ignore */
    }
    return keys;
}

/* ---------- KV client (Vercel-KV-like interface) ---------- */

let kv = null;

async function getKv() {
    if (!kv) {
        kv = {
            get: async (key) => {
                let value = localStorageMap.get(key);
                if (value === undefined) {
                    value = storageGet(key);
                    if (value !== undefined) localStorageMap.set(key, value);
                }
                return value === undefined ? null : value;
            },
            set: async (key, value) => {
                localStorageMap.set(key, value);
                storageSet(key, value);
                return "OK";
            },
            exists: async (key) => {
                if (localStorageMap.has(key)) return 1;
                return storageGet(key) !== undefined ? 1 : 0;
            },
            scan: async (cursor, options = {}) => {
                const { match = "*", count = 10 } = options;
                const pattern = match.replace(/\*/g, ".*");
                const regex = new RegExp(`^${pattern}$`);
                const allKeys = new Set([...localStorageMap.keys(), ...storageKeys()]);
                const matchingKeys = [...allKeys].filter((key) => regex.test(key));
                const startIndex = parseInt(cursor) || 0;
                const endIndex = Math.min(startIndex + count, matchingKeys.length);
                const keys = matchingKeys.slice(startIndex, endIndex);
                const nextCursor = endIndex < matchingKeys.length ? String(endIndex) : '0';
                return [nextCursor, keys];
            },
            del: async (key) => {
                const existed = localStorageMap.delete(key);
                storageRemove(key);
                return existed ? 1 : 0;
            },
            _local: true
        };
    }
    return kv;
}

/* ---------- WASM-facing functions ---------- */

async function kv_get(key) {
    try {
        const kvClient = await getKv();
        const value = await kvClient.get(key);
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value) && !(value instanceof DataView)) return value;
        if (typeof value === 'string') return value;
        return value === null ? undefined : value;
    } catch (error) {
        console.error(`KV get error for ${key}:`, error);
        throw new Error(`Failed to get key ${key}: ${error.message}`);
    }
}

async function kv_get_text(key) {
    try {
        const rawValue = await kv_get(key);
        if (rawValue === undefined || rawValue === null) return undefined;
        if (rawValue instanceof Uint8Array) return new TextDecoder().decode(rawValue);
        if (typeof rawValue === 'string') return rawValue;
        return undefined;
    } catch (error) {
        console.error(`KV get_text error for ${key}:`, error);
        throw new Error(`Failed to get text for key ${key}: ${error.message}`);
    }
}

async function kv_set(key, value) {
    try {
        const kvClient = await getKv();
        await kvClient.set(key, value);
    } catch (error) {
        console.error(`KV set error for ${key}:`, error);
        throw new Error(`Failed to set key ${key}: ${error.message}`);
    }
}

async function kv_set_text(key, value) {
    try {
        const kvClient = await getKv();
        await kvClient.set(key, value);
    } catch (error) {
        console.error(`KV set_text error for ${key}:`, error);
        throw new Error(`Failed to set text for key ${key}: ${error.message}`);
    }
}

async function kv_exists(key) {
    try {
        const kvClient = await getKv();
        const exists = await kvClient.exists(key);
        return exists > 0;
    } catch (error) {
        console.error(`KV exists error for ${key}:`, error);
        return false;
    }
}

async function kv_list(prefix) {
    try {
        const kvClient = await getKv();
        let cursor = 0;
        const keys = [];
        let scanResult;
        do {
            scanResult = await kvClient.scan(cursor, { match: `${prefix}*`, count: 100 });
            cursor = scanResult[0];
            const resultKeys = scanResult[1];
            if (resultKeys && resultKeys.length > 0) keys.push(...resultKeys);
        } while (cursor !== '0');
        return keys;
    } catch (error) {
        console.error(`KV list error for prefix ${prefix}:`, error);
        return [];
    }
}

async function kv_del(key) {
    try {
        const kvClient = await getKv();
        await kvClient.del(key);
    } catch (error) {
        console.error(`KV del error for ${key}:`, error);
    }
}

/* ---------- Fetch helpers ---------- */

async function fetch_url(url) {
    const response = await fetch(url);
    return response;
}

async function response_status(response) {
    if (!(response instanceof Response)) {
        throw new Error("Input is not a Response object");
    }
    return response.status;
}

async function response_bytes(response) {
    if (!(response instanceof Response)) {
        throw new Error("Input is not a Response object");
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

async function wasm_fetch_with_request(url, options) {
    let headers = {};
    if (options && options.headers) {
        const headerEntries = Object.entries(options.headers);
        for (const [key, value] of headerEntries) {
            headers[key] = value;
        }
    }
    const method = options && options.method ? options.method : 'GET';
    const body = options && options.body ? options.body : undefined;
    const response = await fetch(url, { method, headers, body });
    return response;
}

async function response_headers(response) {
    if (!(response instanceof Response)) {
        throw new Error("Input is not a Response object");
    }
    const headers = {};
    for (const [key, value] of response.headers.entries()) {
        headers[key] = value;
    }
    return headers;
}

async function response_text(response) {
    if (!(response instanceof Response)) {
        throw new Error("Input is not a Response object");
    }
    return await response.text();
}

function dummy() {
    return "dummy";
}

async function migrateStorage(oldVersion, newVersion) {
    console.warn(`Storage migration needed from v${oldVersion} to v${newVersion}. Migration logic not implemented yet.`);
    await Promise.resolve();
}

/* ---------- Exports (ESM — consumed by the wasm-bindgen glue) ---------- */

export {
    localStorageMap,
    getKv,
    kv_get,
    kv_set,
    kv_exists,
    kv_list,
    kv_del,
    fetch_url,
    response_status,
    response_bytes,
    wasm_fetch_with_request,
    response_headers,
    response_text,
    getenv,
    dummy,
    migrateStorage,
    kv_get_text,
    kv_set_text,
};
