/* tslint:disable */
/* eslint-disable */

export class DirectoryEntry {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    constructor(name: string, path: string, is_directory: boolean, attributes?: FileAttributes | null);
    /**
     * File attributes
     * For directories, this might hold the directory's own attributes
     * For files, this holds the file's attributes
     */
    get attributes(): FileAttributes | undefined;
    /**
     * File attributes
     * For directories, this might hold the directory's own attributes
     * For files, this holds the file's attributes
     */
    set attributes(value: FileAttributes | null | undefined);
    /**
     * Is this entry a directory
     */
    is_directory: boolean;
    /**
     * Name of the file or directory (not the full path)
     */
    name: string;
    /**
     * Full path to the file or directory
     */
    path: string;
}

export class FileAttributes {
    /**
     ** Return copy of self without private attributes.
     */
    toJSON(): Object;
    /**
     * Return stringified version of self.
     */
    toString(): string;
    free(): void;
    [Symbol.dispose](): void;
    constructor();
    /**
     * Creation timestamp (seconds since UNIX epoch)
     */
    created_at: bigint;
    /**
     * File type (mime type or extension)
     */
    file_type: string;
    /**
     * Is this a directory marker
     */
    is_directory: boolean;
    /**
     * Last modified timestamp (seconds since UNIX epoch)
     */
    modified_at: bigint;
    /**
     * Full path of the file or directory
     */
    path: string;
    /**
     * Size of the file in bytes
     */
    size: number;
    /**
     * Source type of the file: user-modified, cloud-synced, or placeholder
     * - "user" = modified by user and saved locally
     * - "cloud" = pulled from cloud (GitHub) but not modified
     * - "placeholder" = not loaded yet, but known to exist in cloud
     * - "" = unknown or default
     * This field now also implicitly represents the status.
     */
    source_type: string;
}

/**
 * Create directory - admin endpoint
 */
export function admin_create_directory(path: string): Promise<void>;

export function admin_debug_test_panic(): void;

export function admin_delete_file(path: string): Promise<void>;

export function admin_file_exists(path: string): Promise<boolean>;

/**
 * Get file attributes - admin endpoint
 */
export function admin_get_file_attributes(path: string): Promise<FileAttributes>;

export function admin_init_kv_bindings_js(): any;

/**
 * Load all files from a GitHub repository directory recursively.
 * If shallow=true, only creates placeholder entries without downloading content.
 */
export function admin_load_github_directory(path: string, shallow: boolean): Promise<any>;

/**
 * Load only direct children of a GitHub repository directory (non-recursive).
 * If shallow=true, only creates placeholder entries without downloading content.
 */
export function admin_load_github_directory_flat(path: string, shallow: boolean): Promise<any>;

export function admin_read_file(path: string): Promise<string>;

/**
 * Update rules from GitHub repos based on a configuration file
 */
export function admin_update_rules(config_path?: string | null): Promise<any>;

export function admin_write_file(path: string, text_content: string): Promise<void>;

/**
 * Initialize WebAssembly panic hook only (not logging)
 * This function is named differently to avoid name collision with the one in api/init.rs
 */
export function init_panic_hook(): void;

export function init_settings_wasm(pref_path: string): Promise<any>;

export function init_wasm_logging(level?: string | null): void;

/**
 * Initializes the VFS, potentially loading data from GitHub if it's the first time.
 * Returns `true` if the GitHub load was triggered, `false` otherwise.
 */
export function initialize_subconverter_webapp(): Promise<boolean>;

/**
 * List directory contents - admin endpoint
 */
export function list_directory(path: string): Promise<DirectoryEntry[]>;

export function short_url_create(request_json: string, request_url: string): Promise<any>;

export function short_url_delete(id: string): Promise<any>;

/**
 * List all short URLs in the system.
 *
 * This function uses list_directory_skip_github to avoid loading repository data from GitHub,
 * as short URLs are exclusively stored in the KV store and never in the GitHub repository.
 * This improves performance by skipping unnecessary GitHub API calls.
 */
export function short_url_list(): Promise<any>;

export function short_url_move(id: string, new_id: string, request_url: string): Promise<any>;

export function short_url_resolve(id: string, request_url: string): Promise<any>;

export function short_url_update(id: string, request_json: string): Promise<any>;

export function sub_process_wasm(query_json: string): Promise<any>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly init_panic_hook: () => void;
    readonly short_url_create: (a: number, b: number, c: number, d: number) => any;
    readonly short_url_delete: (a: number, b: number) => any;
    readonly short_url_list: () => any;
    readonly short_url_move: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly short_url_resolve: (a: number, b: number, c: number, d: number) => any;
    readonly short_url_update: (a: number, b: number, c: number, d: number) => any;
    readonly admin_create_directory: (a: number, b: number) => any;
    readonly admin_debug_test_panic: () => [number, number];
    readonly admin_delete_file: (a: number, b: number) => any;
    readonly admin_file_exists: (a: number, b: number) => any;
    readonly admin_get_file_attributes: (a: number, b: number) => any;
    readonly admin_init_kv_bindings_js: () => [number, number, number];
    readonly admin_load_github_directory: (a: number, b: number, c: number) => any;
    readonly admin_load_github_directory_flat: (a: number, b: number, c: number) => any;
    readonly admin_read_file: (a: number, b: number) => any;
    readonly admin_update_rules: (a: number, b: number) => any;
    readonly admin_write_file: (a: number, b: number, c: number, d: number) => any;
    readonly list_directory: (a: number, b: number) => any;
    readonly __wbg_directoryentry_free: (a: number, b: number) => void;
    readonly __wbg_fileattributes_free: (a: number, b: number) => void;
    readonly __wbg_get_directoryentry_attributes: (a: number) => number;
    readonly __wbg_get_directoryentry_is_directory: (a: number) => number;
    readonly __wbg_get_directoryentry_name: (a: number) => [number, number];
    readonly __wbg_get_directoryentry_path: (a: number) => [number, number];
    readonly __wbg_get_fileattributes_created_at: (a: number) => bigint;
    readonly __wbg_get_fileattributes_file_type: (a: number) => [number, number];
    readonly __wbg_get_fileattributes_is_directory: (a: number) => number;
    readonly __wbg_get_fileattributes_modified_at: (a: number) => bigint;
    readonly __wbg_get_fileattributes_path: (a: number) => [number, number];
    readonly __wbg_get_fileattributes_size: (a: number) => number;
    readonly __wbg_get_fileattributes_source_type: (a: number) => [number, number];
    readonly __wbg_set_directoryentry_attributes: (a: number, b: number) => void;
    readonly __wbg_set_directoryentry_is_directory: (a: number, b: number) => void;
    readonly __wbg_set_directoryentry_name: (a: number, b: number, c: number) => void;
    readonly __wbg_set_directoryentry_path: (a: number, b: number, c: number) => void;
    readonly __wbg_set_fileattributes_created_at: (a: number, b: bigint) => void;
    readonly __wbg_set_fileattributes_file_type: (a: number, b: number, c: number) => void;
    readonly __wbg_set_fileattributes_is_directory: (a: number, b: number) => void;
    readonly __wbg_set_fileattributes_modified_at: (a: number, b: bigint) => void;
    readonly __wbg_set_fileattributes_path: (a: number, b: number, c: number) => void;
    readonly __wbg_set_fileattributes_size: (a: number, b: number) => void;
    readonly __wbg_set_fileattributes_source_type: (a: number, b: number, c: number) => void;
    readonly directoryentry_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly fileattributes_new: () => number;
    readonly init_settings_wasm: (a: number, b: number) => any;
    readonly sub_process_wasm: (a: number, b: number) => any;
    readonly init_wasm_logging: (a: number, b: number) => [number, number];
    readonly initialize_subconverter_webapp: () => any;
    readonly wasm_bindgen_519bd8a174500762___convert__closures_____invoke___wasm_bindgen_519bd8a174500762___JsValue__core_f0fd674eaa06beef___result__Result_____wasm_bindgen_519bd8a174500762___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_519bd8a174500762___convert__closures_____invoke___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined___js_sys_32cd027fa0e330a9___Function_fn_wasm_bindgen_519bd8a174500762___JsValue_____wasm_bindgen_519bd8a174500762___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen_519bd8a174500762___convert__closures_____invoke___bool__true_: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
