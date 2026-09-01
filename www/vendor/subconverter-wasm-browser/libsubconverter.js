/* @ts-self-types="./libsubconverter.d.ts" */
import { dummy, getenv, kv_del, kv_exists, kv_get, kv_get_text, kv_set, kv_set_text, wasm_fetch_with_request } from './snippets/subconverter-529705871f5acaf0/js/kv_bindings.js';
import * as import1 from "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js"
import * as import2 from "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js"
import * as import3 from "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js"


//#region exports

export class DirectoryEntry {
    static __wrap(ptr) {
        const obj = Object.create(DirectoryEntry.prototype);
        obj.__wbg_ptr = ptr;
        DirectoryEntryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
            attributes: this.attributes,
            is_directory: this.is_directory,
            name: this.name,
            path: this.path,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DirectoryEntryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_directoryentry_free(ptr, 0);
    }
    /**
     * @param {string} name
     * @param {string} path
     * @param {boolean} is_directory
     * @param {FileAttributes | null} [attributes]
     */
    constructor(name, path, is_directory, attributes) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        _assertBoolean(is_directory);
        let ptr2 = 0;
        if (!isLikeNone(attributes)) {
            _assertClass(attributes, FileAttributes);
            if (attributes.__wbg_ptr === 0) {
                throw new Error('Attempt to use a moved value');
            }
            ptr2 = attributes.__destroy_into_raw();
        }
        const ret = wasm.directoryentry_new(ptr0, len0, ptr1, len1, is_directory, ptr2);
        this.__wbg_ptr = ret;
        DirectoryEntryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * File attributes
     * For directories, this might hold the directory's own attributes
     * For files, this holds the file's attributes
     * @returns {FileAttributes | undefined}
     */
    get attributes() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_directoryentry_attributes(this.__wbg_ptr);
        return ret === 0 ? undefined : FileAttributes.__wrap(ret);
    }
    /**
     * Is this entry a directory
     * @returns {boolean}
     */
    get is_directory() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_directoryentry_is_directory(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Name of the file or directory (not the full path)
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.__wbg_get_directoryentry_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Full path to the file or directory
     * @returns {string}
     */
    get path() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.__wbg_get_directoryentry_path(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * File attributes
     * For directories, this might hold the directory's own attributes
     * For files, this holds the file's attributes
     * @param {FileAttributes | null} [arg0]
     */
    set attributes(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, FileAttributes);
            if (arg0.__wbg_ptr === 0) {
                throw new Error('Attempt to use a moved value');
            }
            ptr0 = arg0.__destroy_into_raw();
        }
        wasm.__wbg_set_directoryentry_attributes(this.__wbg_ptr, ptr0);
    }
    /**
     * Is this entry a directory
     * @param {boolean} arg0
     */
    set is_directory(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBoolean(arg0);
        wasm.__wbg_set_directoryentry_is_directory(this.__wbg_ptr, arg0);
    }
    /**
     * Name of the file or directory (not the full path)
     * @param {string} arg0
     */
    set name(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_directoryentry_name(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Full path to the file or directory
     * @param {string} arg0
     */
    set path(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_directoryentry_path(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) DirectoryEntry.prototype[Symbol.dispose] = DirectoryEntry.prototype.free;

export class FileAttributes {
    static __wrap(ptr) {
        const obj = Object.create(FileAttributes.prototype);
        obj.__wbg_ptr = ptr;
        FileAttributesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    toJSON() {
        return {
            created_at: this.created_at,
            file_type: this.file_type,
            is_directory: this.is_directory,
            modified_at: this.modified_at,
            path: this.path,
            size: this.size,
            source_type: this.source_type,
        };
    }
    toString() {
        return JSON.stringify(this);
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FileAttributesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fileattributes_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.fileattributes_new();
        this.__wbg_ptr = ret;
        FileAttributesFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Creation timestamp (seconds since UNIX epoch)
     * @returns {bigint}
     */
    get created_at() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_fileattributes_created_at(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * File type (mime type or extension)
     * @returns {string}
     */
    get file_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.__wbg_get_fileattributes_file_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Is this a directory marker
     * @returns {boolean}
     */
    get is_directory() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_fileattributes_is_directory(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Last modified timestamp (seconds since UNIX epoch)
     * @returns {bigint}
     */
    get modified_at() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_fileattributes_modified_at(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Full path of the file or directory
     * @returns {string}
     */
    get path() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.__wbg_get_fileattributes_path(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Size of the file in bytes
     * @returns {number}
     */
    get size() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_fileattributes_size(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Source type of the file: user-modified, cloud-synced, or placeholder
     * - "user" = modified by user and saved locally
     * - "cloud" = pulled from cloud (GitHub) but not modified
     * - "placeholder" = not loaded yet, but known to exist in cloud
     * - "" = unknown or default
     * This field now also implicitly represents the status.
     * @returns {string}
     */
    get source_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.__wbg_get_fileattributes_source_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Creation timestamp (seconds since UNIX epoch)
     * @param {bigint} arg0
     */
    set created_at(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBigInt(arg0);
        wasm.__wbg_set_fileattributes_created_at(this.__wbg_ptr, arg0);
    }
    /**
     * File type (mime type or extension)
     * @param {string} arg0
     */
    set file_type(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_fileattributes_file_type(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Is this a directory marker
     * @param {boolean} arg0
     */
    set is_directory(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBoolean(arg0);
        wasm.__wbg_set_fileattributes_is_directory(this.__wbg_ptr, arg0);
    }
    /**
     * Last modified timestamp (seconds since UNIX epoch)
     * @param {bigint} arg0
     */
    set modified_at(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBigInt(arg0);
        wasm.__wbg_set_fileattributes_modified_at(this.__wbg_ptr, arg0);
    }
    /**
     * Full path of the file or directory
     * @param {string} arg0
     */
    set path(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_fileattributes_path(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Size of the file in bytes
     * @param {number} arg0
     */
    set size(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(arg0);
        wasm.__wbg_set_fileattributes_size(this.__wbg_ptr, arg0);
    }
    /**
     * Source type of the file: user-modified, cloud-synced, or placeholder
     * - "user" = modified by user and saved locally
     * - "cloud" = pulled from cloud (GitHub) but not modified
     * - "placeholder" = not loaded yet, but known to exist in cloud
     * - "" = unknown or default
     * This field now also implicitly represents the status.
     * @param {string} arg0
     */
    set source_type(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_fileattributes_source_type(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) FileAttributes.prototype[Symbol.dispose] = FileAttributes.prototype.free;

/**
 * Create directory - admin endpoint
 * @param {string} path
 * @returns {Promise<void>}
 */
export function admin_create_directory(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_create_directory(ptr0, len0);
    return ret;
}

export function admin_debug_test_panic() {
    const ret = wasm.admin_debug_test_panic();
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export function admin_delete_file(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_delete_file(ptr0, len0);
    return ret;
}

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export function admin_file_exists(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_file_exists(ptr0, len0);
    return ret;
}

/**
 * Get file attributes - admin endpoint
 * @param {string} path
 * @returns {Promise<FileAttributes>}
 */
export function admin_get_file_attributes(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_get_file_attributes(ptr0, len0);
    return ret;
}

/**
 * @returns {any}
 */
export function admin_init_kv_bindings_js() {
    const ret = wasm.admin_init_kv_bindings_js();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Load all files from a GitHub repository directory recursively.
 * If shallow=true, only creates placeholder entries without downloading content.
 * @param {string} path
 * @param {boolean} shallow
 * @returns {Promise<any>}
 */
export function admin_load_github_directory(path, shallow) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    _assertBoolean(shallow);
    const ret = wasm.admin_load_github_directory(ptr0, len0, shallow);
    return ret;
}

/**
 * Load only direct children of a GitHub repository directory (non-recursive).
 * If shallow=true, only creates placeholder entries without downloading content.
 * @param {string} path
 * @param {boolean} shallow
 * @returns {Promise<any>}
 */
export function admin_load_github_directory_flat(path, shallow) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    _assertBoolean(shallow);
    const ret = wasm.admin_load_github_directory_flat(ptr0, len0, shallow);
    return ret;
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export function admin_read_file(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_read_file(ptr0, len0);
    return ret;
}

/**
 * Update rules from GitHub repos based on a configuration file
 * @param {string | null} [config_path]
 * @returns {Promise<any>}
 */
export function admin_update_rules(config_path) {
    var ptr0 = isLikeNone(config_path) ? 0 : passStringToWasm0(config_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.admin_update_rules(ptr0, len0);
    return ret;
}

/**
 * @param {string} path
 * @param {string} text_content
 * @returns {Promise<void>}
 */
export function admin_write_file(path, text_content) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(text_content, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.admin_write_file(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Initialize WebAssembly panic hook only (not logging)
 * This function is named differently to avoid name collision with the one in api/init.rs
 */
export function init_panic_hook() {
    wasm.init_panic_hook();
}

/**
 * @param {string} pref_path
 * @returns {Promise<any>}
 */
export function init_settings_wasm(pref_path) {
    const ptr0 = passStringToWasm0(pref_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.init_settings_wasm(ptr0, len0);
    return ret;
}

/**
 * @param {string | null} [level]
 */
export function init_wasm_logging(level) {
    var ptr0 = isLikeNone(level) ? 0 : passStringToWasm0(level, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.init_wasm_logging(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Initializes the VFS, potentially loading data from GitHub if it's the first time.
 * Returns `true` if the GitHub load was triggered, `false` otherwise.
 * @returns {Promise<boolean>}
 */
export function initialize_subconverter_webapp() {
    const ret = wasm.initialize_subconverter_webapp();
    return ret;
}

/**
 * List directory contents - admin endpoint
 * @param {string} path
 * @returns {Promise<DirectoryEntry[]>}
 */
export function list_directory(path) {
    const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.list_directory(ptr0, len0);
    return ret;
}

/**
 * @param {string} request_json
 * @param {string} request_url
 * @returns {Promise<any>}
 */
export function short_url_create(request_json, request_url) {
    const ptr0 = passStringToWasm0(request_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(request_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.short_url_create(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * @param {string} id
 * @returns {Promise<any>}
 */
export function short_url_delete(id) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.short_url_delete(ptr0, len0);
    return ret;
}

/**
 * List all short URLs in the system.
 *
 * This function uses list_directory_skip_github to avoid loading repository data from GitHub,
 * as short URLs are exclusively stored in the KV store and never in the GitHub repository.
 * This improves performance by skipping unnecessary GitHub API calls.
 * @returns {Promise<any>}
 */
export function short_url_list() {
    const ret = wasm.short_url_list();
    return ret;
}

/**
 * @param {string} id
 * @param {string} new_id
 * @param {string} request_url
 * @returns {Promise<any>}
 */
export function short_url_move(id, new_id, request_url) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(new_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(request_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.short_url_move(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * @param {string} id
 * @param {string} request_url
 * @returns {Promise<any>}
 */
export function short_url_resolve(id, request_url) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(request_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.short_url_resolve(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * @param {string} id
 * @param {string} request_json
 * @returns {Promise<any>}
 */
export function short_url_update(id, request_json) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(request_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.short_url_update(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * @param {string} query_json
 * @returns {Promise<any>}
 */
export function sub_process_wasm(query_json) {
    const ptr0 = passStringToWasm0(query_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.sub_process_wasm(ptr0, len0);
    return ret;
}

//#endregion

//#region wasm imports
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_408e67f47ca7b58b: function() { return logError(function (arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_Number_3890faa6d3ff057d: function() { return logError(function (arg0) {
            const ret = Number(arg0);
            return ret;
        }, arguments); },
        __wbg_String_8564e559799eccda: function() { return logError(function (arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg___wbindgen_boolean_get_c9c83ebd41b34df3: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            if (!isLikeNone(ret)) {
                _assertBoolean(ret);
            }
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_5e4570eb24ffa122: function(arg0) {
            const ret = typeof(arg0) === 'function';
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_null_7d13f41e1a2d5140: function(arg0) {
            const ret = arg0 === null;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_object_a2790eb24c211ea0: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
            const ret = arg0 === undefined;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_acf2776254a8d832: function(arg0, arg1) {
            const ret = arg0 == arg1;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_number_get_136b9679cab35cfb: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            if (!isLikeNone(ret)) {
                _assertNum(ret);
            }
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_d154f1e671052120: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_be22cc64ae6946a0: function() { return logError(function (arg0) {
            arg0._wbg_cb_unref();
        }, arguments); },
        __wbg_call_1c5886ab9c57d1c7: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_35dba3c747ad7521: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_debug_3853dbaf0bca30f9: function() { return logError(function (arg0) {
            console.debug(arg0);
        }, arguments); },
        __wbg_directoryentry_new: function() { return logError(function (arg0) {
            const ret = DirectoryEntry.__wrap(arg0);
            return ret;
        }, arguments); },
        __wbg_done_669171204c3dcae2: function() { return logError(function (arg0) {
            const ret = arg0.done;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_dummy_2b89d702304218bc: function() { return handleError(function () {
            const ret = dummy();
            return ret;
        }, arguments); },
        __wbg_entries_7774d489e1da5f4f: function() { return logError(function (arg0) {
            const ret = Object.entries(arg0);
            return ret;
        }, arguments); },
        __wbg_error_757e9472f8410341: function() { return logError(function (arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        }, arguments); },
        __wbg_error_dd408a7b3cb542dd: function() { return logError(function (arg0) {
            console.error(arg0);
        }, arguments); },
        __wbg_fetch_729fad2e5272298f: function() { return logError(function (arg0, arg1) {
            const ret = arg0.fetch(arg1);
            return ret;
        }, arguments); },
        __wbg_fileattributes_new: function() { return logError(function (arg0) {
            const ret = FileAttributes.__wrap(arg0);
            return ret;
        }, arguments); },
        __wbg_get_c0c8f8d7da0c03dd: function() { return logError(function (arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        }, arguments); },
        __wbg_get_d173c0308df22d37: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_e20b893aeafc3fca: function() { return logError(function (arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        }, arguments); },
        __wbg_getenv_3a9cb8f78aafa9b5: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            const ret = getenv(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_headers_6dedf39f001ae99d: function() { return logError(function (arg0) {
            const ret = arg0.headers;
            return ret;
        }, arguments); },
        __wbg_headers_92567b07014384b9: function() { return logError(function (arg0) {
            const ret = arg0.headers;
            return ret;
        }, arguments); },
        __wbg_info_726982aff9befe16: function() { return logError(function (arg0) {
            console.info(arg0);
        }, arguments); },
        __wbg_instanceof_ArrayBuffer_993d02d2d254cad1: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Object_80ad464782e2bd73: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Object;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Response_8f49efbd4bfd76d6: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Uint8Array_f935dbb0aa7cdeed: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Window_5625ff9937037a38: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_isArray_6339f732981044bf: function() { return logError(function (arg0) {
            const ret = Array.isArray(arg0);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_isSafeInteger_f3d6cd19ccfe4512: function() { return logError(function (arg0) {
            const ret = Number.isSafeInteger(arg0);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_iterator_5cebbb86e33c6dd6: function() { return logError(function () {
            const ret = Symbol.iterator;
            return ret;
        }, arguments); },
        __wbg_kv_del_f8585111cdd21199: function() { return handleError(function (arg0, arg1) {
            const ret = kv_del(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_kv_exists_08edeaf9dc36a840: function() { return handleError(function (arg0, arg1) {
            const ret = kv_exists(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_kv_get_66f4eb02774d3223: function() { return handleError(function (arg0, arg1) {
            const ret = kv_get(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_kv_get_text_d214c1f1ba84c181: function() { return handleError(function (arg0, arg1) {
            const ret = kv_get_text(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_kv_set_d8d2709eb632eb6a: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = kv_set(getStringFromWasm0(arg0, arg1), getArrayU8FromWasm0(arg2, arg3));
            return ret;
        }, arguments); },
        __wbg_kv_set_text_bba8ad267689a3ca: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = kv_set_text(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        }, arguments); },
        __wbg_length_36bd29c6848c2144: function() { return logError(function (arg0) {
            const ret = arg0.length;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_length_ecfa2c63d3d0d82c: function() { return logError(function (arg0) {
            const ret = arg0.length;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_log_e6372b4fbfc9f81e: function() { return logError(function (arg0) {
            console.log(arg0);
        }, arguments); },
        __wbg_new_116be93542d39019: function() { return logError(function () {
            const ret = new Array();
            return ret;
        }, arguments); },
        __wbg_new_227d7c05414eb861: function() { return logError(function () {
            const ret = new Error();
            return ret;
        }, arguments); },
        __wbg_new_77cc4f4f472aeb81: function() { return logError(function (arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        }, arguments); },
        __wbg_new_95039e162b0c4466: function() { return handleError(function () {
            const ret = new Headers();
            return ret;
        }, arguments); },
        __wbg_new_ebe3e0f6837f0879: function() { return logError(function () {
            const ret = new Object();
            return ret;
        }, arguments); },
        __wbg_new_typed_cceaf62d8d95e9f2: function() { return logError(function (arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_519bd8a174500762___convert__closures_____invoke___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        }, arguments); },
        __wbg_new_with_str_and_init_5a37d576dec75a86: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbg_next_42cf16ee0dafc9e2: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_8f26b64fa5e9f64b: function() { return logError(function (arg0) {
            const ret = arg0.next;
            return ret;
        }, arguments); },
        __wbg_now_8b265300afd5f2b9: function() { return logError(function () {
            const ret = Date.now();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_de8e0d9553586985: function() { return logError(function (arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        }, arguments); },
        __wbg_queueMicrotask_ac694eae12e92dfb: function() { return logError(function (arg0) {
            queueMicrotask(arg0);
        }, arguments); },
        __wbg_queueMicrotask_be5fe34a8f4cad4d: function() { return logError(function (arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        }, arguments); },
        __wbg_random_b0d98802be10ff20: function() { return logError(function () {
            const ret = Math.random();
            return ret;
        }, arguments); },
        __wbg_reject_671a1c459689d0e0: function() { return logError(function (arg0) {
            const ret = Promise.reject(arg0);
            return ret;
        }, arguments); },
        __wbg_resolve_020f95d838c6ef25: function() { return logError(function (arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        }, arguments); },
        __wbg_run_ef366b557a6598c4: function() { return logError(function (arg0, arg1, arg2) {
            try {
                var state0 = {a: arg1, b: arg2};
                var cb0 = () => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_519bd8a174500762___convert__closures_____invoke___bool__true_(a, state0.b, );
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = arg0.run(cb0);
                _assertBoolean(ret);
                return ret;
            } finally {
                state0.a = 0;
            }
        }, arguments); },
        __wbg_set_6be42768c690e380: function() { return logError(function (arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        }, arguments); },
        __wbg_set_8155bb79a948541b: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_set_a80955eb93b145c6: function() { return logError(function (arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        }, arguments); },
        __wbg_set_body_f301b68bff45f419: function() { return logError(function (arg0, arg1) {
            arg0.body = arg1;
        }, arguments); },
        __wbg_set_e92392c4b44c5de1: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_set_headers_805555608daf7f2a: function() { return logError(function (arg0, arg1) {
            arg0.headers = arg1;
        }, arguments); },
        __wbg_set_method_cf2b992b9a610bc3: function() { return logError(function (arg0, arg1, arg2) {
            arg0.method = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_mode_d6479dfd6696c8d3: function() { return logError(function (arg0, arg1) {
            arg0.mode = __wbindgen_enum_RequestMode[arg1];
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function() { return logError(function (arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_static_accessor_CREATE_TASK_307e3054ac4aa976: function() { return logError(function () {
            const ret = typeof console === 'undefined' ? null : console?.createTask;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_GLOBAL_THIS_466428f93b4eaa76: function() { return logError(function () {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_GLOBAL_c7aea38d4de089bc: function() { return logError(function () {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_SELF_42d4fae05e59267a: function() { return logError(function () {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_WINDOW_e0db14a0eba6a812: function() { return logError(function () {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_status_b0de02a07fd7d927: function() { return logError(function (arg0) {
            const ret = arg0.status;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_text_9302f33ea8cfce7b: function() { return handleError(function (arg0) {
            const ret = arg0.text();
            return ret;
        }, arguments); },
        __wbg_then_7026b513a94278a8: function() { return logError(function (arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        }, arguments); },
        __wbg_then_72819b8d4e081fb5: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_value_1e2369fab29b420e: function() { return logError(function (arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments); },
        __wbg_warn_917d7f727ab78481: function() { return logError(function (arg0) {
            console.warn(arg0);
        }, arguments); },
        __wbg_wasm_fetch_with_request_c30f0c48dff781a1: function() { return logError(function (arg0, arg1, arg2) {
            const ret = wasm_fetch_with_request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000001: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 3442, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_519bd8a174500762___convert__closures_____invoke___wasm_bindgen_519bd8a174500762___JsValue__core_f0fd674eaa06beef___result__Result_____wasm_bindgen_519bd8a174500762___JsError___true_);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000002: function() { return logError(function (arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000003: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000004: function() { return logError(function (arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000005: function() { return logError(function (arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1);
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("DirectoryEntry")) -> Externref`.
            const ret = v0;
            return ret;
        }, arguments); },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./libsubconverter_bg.js": import0,
        "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js": import1,
        "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js": import2,
        "./snippets/subconverter-529705871f5acaf0/js/kv_bindings.js": import3,
    };
}


//#endregion
function wasm_bindgen_519bd8a174500762___convert__closures_____invoke___bool__true_(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    const ret = wasm.wasm_bindgen_519bd8a174500762___convert__closures_____invoke___bool__true_(arg0, arg1);
    return ret !== 0;
}

function wasm_bindgen_519bd8a174500762___convert__closures_____invoke___wasm_bindgen_519bd8a174500762___JsValue__core_f0fd674eaa06beef___result__Result_____wasm_bindgen_519bd8a174500762___JsError___true_(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    const ret = wasm.wasm_bindgen_519bd8a174500762___convert__closures_____invoke___wasm_bindgen_519bd8a174500762___JsValue__core_f0fd674eaa06beef___result__Result_____wasm_bindgen_519bd8a174500762___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_519bd8a174500762___convert__closures_____invoke___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen_519bd8a174500762___convert__closures_____invoke___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];
const DirectoryEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_directoryentry_free(ptr, 1));
const FileAttributesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fileattributes_free(ptr, 1));


//#region intrinsics
function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertBigInt(n) {
    if (typeof(n) !== 'bigint') throw new Error(`expected a bigint argument, found ${typeof(n)}`);
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


//#endregion

//#region wasm loading
let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('libsubconverter_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
//#endregion
export { wasm as __wasm }
