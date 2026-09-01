use crate::utils::file_wasm;
use crate::utils::system::safe_system_time;
use crate::vfs::vercel_kv_vfs::VercelKvVfs;
use crate::vfs::{vercel_kv_types::VirtualFileSystem, VfsError};
use js_sys::Math;
use log::{error, info};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::UNIX_EPOCH;
use wasm_bindgen::prelude::*;

const SHORT_URL_DIR: &str = "/short";
const ENDPOINTS_CONFIG_PATH: &str = "/config/endpoints.json";
const DEFAULT_ENDPOINT_PATH: &str = "/api/sub";
const ALPHABET: [char; 62] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
    'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B',
    'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'V', 'W', 'X', 'Y', 'Z',
];

#[derive(Serialize, Deserialize, Debug)]
pub struct ShortUrlData {
    pub target_url: String,
    /// Structured conversion query parameters (e.g. {"target":"clash","url":"https://..."}).
    /// When present, the redirect target is built dynamically from the enabled endpoint.
    pub params: Option<Value>,
    /// Optional endpoint override. When absent, the globally enabled/default endpoint is used.
    pub endpoint_id: Option<String>,
    pub created_at: u64,
    pub last_used: Option<u64>,
    pub use_count: u64,
    pub custom_id: bool,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateShortUrlRequest {
    pub target_url: String,
    pub params: Option<Value>,
    pub endpoint_id: Option<String>,
    pub custom_id: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ShortUrlResponse {
    pub id: String,
    pub target_url: String,
    pub short_url: String,
    pub params: Option<Value>,
    pub endpoint_id: Option<String>,
    pub created_at: u64,
    pub last_used: Option<u64>,
    pub use_count: u64,
    pub custom_id: bool,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ShortUrlList {
    pub urls: Vec<ShortUrlResponse>,
}

/// A configurable conversion endpoint that short links redirect to.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConversionEndpoint {
    pub id: String,
    pub name: String,
    /// Base URL of the conversion service. Empty means "current site" (resolved
    /// from the incoming request at redirect time).
    #[serde(default)]
    pub base_url: String,
    /// API path on the endpoint service. Defaults to `/api/sub`.
    #[serde(default = "default_endpoint_path")]
    pub path: String,
}

fn default_endpoint_path() -> String {
    DEFAULT_ENDPOINT_PATH.to_string()
}

/// Server configuration listing all conversion endpoints and the active default.
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct EndpointsConfig {
    #[serde(default)]
    pub endpoints: Vec<ConversionEndpoint>,
    /// ID of the endpoint that is currently enabled. Short links without an
    /// explicit endpoint_id redirect to this one.
    #[serde(default)]
    pub default_endpoint: String,
}

async fn get_vfs() -> Result<VercelKvVfs, VfsError> {
    file_wasm::get_vfs()
        .await
        .map_err(|e| VfsError::Other(format!("Failed to get VFS: {}", e)))
}

// Generate a short ID using WASM-compatible random generation
fn generate_short_id(length: usize) -> String {
    let mut id = String::with_capacity(length);
    let alphabet_len = ALPHABET.len();

    for _ in 0..length {
        let random_index = (Math::random() * alphabet_len as f64).floor() as usize;
        id.push(ALPHABET[random_index]);
    }

    id
}

// Get current timestamp in seconds
fn current_timestamp() -> u64 {
    safe_system_time()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

// Create short URL directory if it doesn't exist
async fn ensure_short_dir_exists(vfs: &VercelKvVfs) -> Result<(), VfsError> {
    if !vfs.exists(SHORT_URL_DIR).await? {
        vfs.create_directory(SHORT_URL_DIR).await?;
        info!("Created short URL directory: {}", SHORT_URL_DIR);
    }
    Ok(())
}

// Build the full file path for a short ID
fn get_short_url_path(id: &str) -> String {
    format!("{}/{}.json", SHORT_URL_DIR, id)
}

// Build the full short URL for a short ID
fn get_full_short_url(request_url: &str, id: &str) -> String {
    // Extract base URL from the request
    let url_parts: Vec<&str> = request_url.split("/api/").collect();
    let base_url = url_parts[0];
    format!("{}/api/s/{}", base_url, id)
}

// Extract the origin (scheme + host + port) from a request URL
fn get_origin(request_url: &str) -> String {
    match url::Url::parse(request_url) {
        Ok(parsed) => parsed.origin().ascii_serialization(),
        Err(_) => String::new(),
    }
}

// Load the endpoints configuration from the KV store. Falls back to an empty
// config (i.e. "current site + /api/sub") when the file is missing.
async fn load_endpoints_config(vfs: &VercelKvVfs) -> EndpointsConfig {
    match vfs.read_file(ENDPOINTS_CONFIG_PATH).await {
        Ok(content) => serde_json::from_slice::<EndpointsConfig>(&content)
            .unwrap_or_else(|e| {
                error!("Error parsing endpoints config: {}", e);
                EndpointsConfig::default()
            }),
        Err(_) => EndpointsConfig::default(),
    }
}

// Pick the endpoint to use: explicit link override > enabled default > first.
fn select_endpoint<'a>(
    config: &'a EndpointsConfig,
    endpoint_id: Option<&str>,
) -> Option<&'a ConversionEndpoint> {
    if let Some(id) = endpoint_id {
        if let Some(ep) = config.endpoints.iter().find(|e| e.id == id) {
            return Some(ep);
        }
    }
    if !config.default_endpoint.is_empty() {
        if let Some(ep) = config
            .endpoints
            .iter()
            .find(|e| e.id == config.default_endpoint)
        {
            return Some(ep);
        }
    }
    config.endpoints.first()
}

// Serialize structured params into a URL-encoded query string (stable key order)
fn build_query_string(params: &Value) -> String {
    let Some(obj) = params.as_object() else {
        return String::new();
    };
    let mut entries: Vec<(&String, &Value)> = obj.iter().collect();
    entries.sort_by(|a, b| a.0.cmp(b.0));

    let mut parts = Vec::with_capacity(entries.len());
    for (key, value) in entries {
        let key_enc = urlencoding::encode(key).into_owned();
        let value_enc = match value {
            Value::String(s) => urlencoding::encode(s).into_owned(),
            Value::Number(n) => n.to_string(),
            Value::Bool(true) => "1".to_string(),
            Value::Bool(false) => "0".to_string(),
            Value::Null => String::new(),
            _ => urlencoding::encode(&value.to_string()).into_owned(),
        };
        parts.push(format!("{}={}", key_enc, value_enc));
    }
    parts.join("&")
}

// Combine an origin/base_url + path + query into a final redirect URL
fn join_endpoint_url(base_url: &str, path: &str, query: &str) -> String {
    let base = base_url.trim_end_matches('/');
    let path = if path.is_empty() {
        DEFAULT_ENDPOINT_PATH.to_string()
    } else if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{}", path)
    };
    let mut url = format!("{}{}", base, path);
    if !query.is_empty() {
        url.push('?');
        url.push_str(query);
    }
    url
}

// Build the final redirect URL for a short link from its stored params and the
// selected endpoint. Falls back to "current site + /api/sub" when no endpoint
// is configured.
fn build_resolved_target(
    request_url: &str,
    endpoint: Option<&ConversionEndpoint>,
    params: &Value,
) -> String {
    let query = build_query_string(params);
    match endpoint {
        Some(ep) => {
            let origin = if ep.base_url.trim().is_empty() {
                get_origin(request_url)
            } else {
                ep.base_url.trim_end_matches('/').to_string()
            };
            join_endpoint_url(&origin, &ep.path, &query)
        }
        None => {
            let origin = get_origin(request_url);
            join_endpoint_url(&origin, DEFAULT_ENDPOINT_PATH, &query)
        }
    }
}

#[wasm_bindgen]
pub async fn short_url_create(
    request_json: String,
    request_url: String,
) -> Result<JsValue, JsValue> {
    info!("short_url_create called");

    // Parse request
    let request: CreateShortUrlRequest = match serde_json::from_str(&request_json) {
        Ok(req) => req,
        Err(e) => {
            error!("Error parsing create short URL request: {}", e);
            return Err(JsValue::from_str(&format!("Invalid request format: {}", e)));
        }
    };

    if request.target_url.is_empty() {
        return Err(JsValue::from_str("Target URL is required"));
    }

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Ensure short URL directory exists
    if let Err(e) = ensure_short_dir_exists(&vfs).await {
        error!("Error ensuring short URL directory exists: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error creating directory: {}",
            e
        )));
    }

    // Generate or use custom ID
    let id = if let Some(custom_id) = &request.custom_id {
        // Check if custom ID already exists
        let path = get_short_url_path(custom_id);
        if vfs.exists(&path).await.unwrap_or(false) {
            return Err(JsValue::from_str("Custom ID already exists"));
        }
        custom_id.clone()
    } else {
        // Generate a unique short ID
        let mut attempts = 0;
        let mut id;
        loop {
            // Start with 6 chars, increase if needed
            let length = 6 + attempts / 3;
            id = generate_short_id(length);
            let path = get_short_url_path(&id);
            if !vfs.exists(&path).await.unwrap_or(true) {
                break;
            }
            attempts += 1;
            if attempts > 10 {
                return Err(JsValue::from_str("Failed to generate a unique short ID"));
            }
        }
        id
    };

    // Create short URL data
    let short_url_data = ShortUrlData {
        target_url: request.target_url.clone(),
        params: request.params.clone(),
        endpoint_id: request.endpoint_id.clone(),
        created_at: current_timestamp(),
        last_used: None,
        use_count: 0,
        custom_id: request.custom_id.is_some(),
        description: request.description,
    };

    // Serialize to JSON
    let json_content = match serde_json::to_string(&short_url_data) {
        Ok(json) => json,
        Err(e) => {
            error!("Error serializing short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Serialization error: {}", e)));
        }
    };

    // Write to VFS
    let path = get_short_url_path(&id);
    if let Err(e) = vfs.write_file(&path, json_content.into_bytes()).await {
        error!("Error writing short URL to VFS: {}", e);
        return Err(JsValue::from_str(&format!("Error saving short URL: {}", e)));
    }

    // Build response
    let short_url = get_full_short_url(&request_url, &id);
    let response = ShortUrlResponse {
        id: id.clone(),
        target_url: request.target_url,
        short_url,
        params: short_url_data.params.clone(),
        endpoint_id: short_url_data.endpoint_id.clone(),
        created_at: short_url_data.created_at,
        last_used: None,
        use_count: 0,
        custom_id: request.custom_id.is_some(),
        description: short_url_data.description,
    };

    // Return response
    match serde_json::to_string(&response) {
        Ok(json) => Ok(JsValue::from_str(&json)),
        Err(e) => {
            error!("Error serializing response: {}", e);
            Err(JsValue::from_str(&format!(
                "Error creating response: {}",
                e
            )))
        }
    }
}

#[wasm_bindgen]
pub async fn short_url_resolve(id: String, request_url: String) -> Result<JsValue, JsValue> {
    info!("short_url_resolve called for ID: {}", id);

    // Validate ID
    if id.is_empty() {
        return Err(JsValue::from_str("Short URL ID is required"));
    }

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Get the short URL data
    let path = get_short_url_path(&id);
    let content = match vfs.read_file(&path).await {
        Ok(content) => content,
        Err(e) => {
            error!("Error reading short URL: {}", e);
            return Err(JsValue::from_str(&format!("Short URL not found: {}", e)));
        }
    };

    // Parse short URL data
    let mut short_url_data: ShortUrlData = match serde_json::from_slice(&content) {
        Ok(data) => data,
        Err(e) => {
            error!("Error parsing short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Invalid short URL data: {}", e)));
        }
    };

    // Update usage statistics
    short_url_data.last_used = Some(current_timestamp());
    short_url_data.use_count += 1;

    // Write updated data back
    let updated_json = match serde_json::to_string(&short_url_data) {
        Ok(json) => json,
        Err(e) => {
            error!("Error serializing updated short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Serialization error: {}", e)));
        }
    };

    if let Err(e) = vfs.write_file(&path, updated_json.into_bytes()).await {
        error!("Error updating short URL stats: {}", e);
        // Continue even if update fails
    }

    // Build the redirect target. Short links created with structured params are
    // "permanent": they resolve against the currently enabled conversion endpoint
    // at redirect time, so switching the enabled endpoint re-points them
    // automatically. Legacy links (plain target_url) keep their stored URL.
    let target_url = if let Some(params) = &short_url_data.params {
        if params.as_object().map(|o| o.is_empty()).unwrap_or(true) {
            short_url_data.target_url.clone()
        } else {
            let config = load_endpoints_config(&vfs).await;
            let endpoint = select_endpoint(&config, short_url_data.endpoint_id.as_deref());
            build_resolved_target(&request_url, endpoint, params)
        }
    } else {
        short_url_data.target_url.clone()
    };

    // Return target URL for redirection
    let response = json!({
        "target_url": target_url,
        "use_count": short_url_data.use_count,
        "endpoint_id": short_url_data.endpoint_id,
        "params": short_url_data.params,
    });

    Ok(JsValue::from_str(&response.to_string()))
}

#[wasm_bindgen]
pub async fn short_url_delete(id: String) -> Result<JsValue, JsValue> {
    info!("short_url_delete called for ID: {}", id);

    // Validate ID
    if id.is_empty() {
        return Err(JsValue::from_str("Short URL ID is required"));
    }

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Check if the short URL exists
    let path = get_short_url_path(&id);
    if !vfs.exists(&path).await.unwrap_or(false) {
        return Err(JsValue::from_str("Short URL not found"));
    }

    // Delete the short URL
    if let Err(e) = vfs.delete_file(&path).await {
        error!("Error deleting short URL: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error deleting short URL: {}",
            e
        )));
    }

    // Return success
    Ok(JsValue::from_str("{\"success\":true}"))
}

/// List all short URLs in the system.
///
/// This function uses list_directory_skip_github to avoid loading repository data from GitHub,
/// as short URLs are exclusively stored in the KV store and never in the GitHub repository.
/// This improves performance by skipping unnecessary GitHub API calls.
#[wasm_bindgen]
pub async fn short_url_list() -> Result<JsValue, JsValue> {
    info!("short_url_list called");

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Ensure short URL directory exists
    if let Err(e) = ensure_short_dir_exists(&vfs).await {
        error!("Error ensuring short URL directory exists: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error accessing directory: {}",
            e
        )));
    }

    // List all files in the short URL directory (skip GitHub loading)
    let entries = match vfs.list_directory_skip_github(SHORT_URL_DIR).await {
        Ok(entries) => entries,
        Err(e) => {
            error!("Error listing short URLs: {}", e);
            return Err(JsValue::from_str(&format!(
                "Error listing short URLs: {}",
                e
            )));
        }
    };

    // Process each short URL file
    let mut urls = Vec::new();
    for entry in entries {
        if entry.is_directory || !entry.path.ends_with(".json") {
            continue;
        }

        // Extract ID from filename
        let filename = entry.name.strip_suffix(".json").unwrap_or(&entry.name);

        // Read short URL data
        let content = match vfs.read_file(&entry.path).await {
            Ok(content) => content,
            Err(e) => {
                error!("Error reading short URL {}: {}", entry.path, e);
                continue;
            }
        };

        // Parse short URL data
        let short_url_data: ShortUrlData = match serde_json::from_slice(&content) {
            Ok(data) => data,
            Err(e) => {
                error!("Error parsing short URL data {}: {}", entry.path, e);
                continue;
            }
        };

        // Base URL can't be determined here, will be filled in on frontend
        let short_url = format!("/api/s/{}", filename);

        // Create response object
        let url = ShortUrlResponse {
            id: filename.to_string(),
            target_url: short_url_data.target_url,
            short_url,
            params: short_url_data.params.clone(),
            endpoint_id: short_url_data.endpoint_id.clone(),
            created_at: short_url_data.created_at,
            last_used: short_url_data.last_used,
            use_count: short_url_data.use_count,
            custom_id: short_url_data.custom_id,
            description: short_url_data.description,
        };

        urls.push(url);
    }

    // Sort by creation date (newest first)
    urls.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    // Return the list
    let response = ShortUrlList { urls };
    match serde_json::to_string(&response) {
        Ok(json) => Ok(JsValue::from_str(&json)),
        Err(e) => {
            error!("Error serializing response: {}", e);
            Err(JsValue::from_str(&format!(
                "Error creating response: {}",
                e
            )))
        }
    }
}

#[wasm_bindgen]
pub async fn short_url_update(id: String, request_json: String) -> Result<JsValue, JsValue> {
    info!("short_url_update called for ID: {}", id);

    // Validate ID
    if id.is_empty() {
        return Err(JsValue::from_str("Short URL ID is required"));
    }

    // Parse request
    let request: Value = match serde_json::from_str(&request_json) {
        Ok(req) => req,
        Err(e) => {
            error!("Error parsing update short URL request: {}", e);
            return Err(JsValue::from_str(&format!("Invalid request format: {}", e)));
        }
    };

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Get the short URL data
    let path = get_short_url_path(&id);
    let content = match vfs.read_file(&path).await {
        Ok(content) => content,
        Err(e) => {
            error!("Error reading short URL: {}", e);
            return Err(JsValue::from_str(&format!("Short URL not found: {}", e)));
        }
    };

    // Parse short URL data
    let mut short_url_data: ShortUrlData = match serde_json::from_slice(&content) {
        Ok(data) => data,
        Err(e) => {
            error!("Error parsing short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Invalid short URL data: {}", e)));
        }
    };

    // Update fields
    if let Some(target_url) = request.get("target_url").and_then(|v| v.as_str()) {
        if !target_url.is_empty() {
            short_url_data.target_url = target_url.to_string();
        }
    }

    if let Some(params) = request.get("params") {
        short_url_data.params = if params.is_null() {
            None
        } else {
            Some(params.clone())
        };
    }

    if let Some(endpoint_id) = request.get("endpoint_id") {
        short_url_data.endpoint_id = if endpoint_id.is_null() {
            None
        } else {
            endpoint_id.as_str().map(|s| s.to_string())
        };
    }

    if let Some(description) = request.get("description") {
        short_url_data.description = if description.is_null() {
            None
        } else {
            description.as_str().map(|s| s.to_string())
        };
    }

    // Write updated data
    let updated_json = match serde_json::to_string(&short_url_data) {
        Ok(json) => json,
        Err(e) => {
            error!("Error serializing updated short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Serialization error: {}", e)));
        }
    };

    if let Err(e) = vfs.write_file(&path, updated_json.into_bytes()).await {
        error!("Error updating short URL: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error updating short URL: {}",
            e
        )));
    }

    // Return updated data
    let response = json!({
        "id": id,
        "target_url": short_url_data.target_url,
        "short_url": format!("/api/s/{}", id),
        "params": short_url_data.params,
        "endpoint_id": short_url_data.endpoint_id,
        "created_at": short_url_data.created_at,
        "last_used": short_url_data.last_used,
        "use_count": short_url_data.use_count,
        "custom_id": short_url_data.custom_id,
        "description": short_url_data.description
    });

    Ok(JsValue::from_str(&response.to_string()))
}

#[wasm_bindgen]
pub async fn short_url_move(
    id: String,
    new_id: String,
    request_url: String,
) -> Result<JsValue, JsValue> {
    info!("short_url_move called for ID: {} -> {}", id, new_id);

    // Validate IDs
    if id.is_empty() || new_id.is_empty() {
        return Err(JsValue::from_str(
            "Both source and destination IDs are required",
        ));
    }

    // Ensure IDs are different
    if id == new_id {
        return Err(JsValue::from_str(
            "Source and destination IDs must be different",
        ));
    }

    let vfs = match get_vfs().await {
        Ok(vfs) => vfs,
        Err(e) => {
            error!("Error getting VFS: {}", e);
            return Err(JsValue::from_str(&format!("VFS error: {}", e)));
        }
    };

    // Ensure short URL directory exists
    if let Err(e) = ensure_short_dir_exists(&vfs).await {
        error!("Error ensuring short URL directory exists: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error with short URL directory: {}",
            e
        )));
    }

    // Check if source exists
    let source_path = get_short_url_path(&id);
    if !vfs.exists(&source_path).await.unwrap_or(false) {
        return Err(JsValue::from_str("Source short URL not found"));
    }

    // Check if destination already exists
    let dest_path = get_short_url_path(&new_id);
    if vfs.exists(&dest_path).await.unwrap_or(false) {
        return Err(JsValue::from_str("Destination ID already exists"));
    }

    // Read the source file content
    let content = match vfs.read_file(&source_path).await {
        Ok(content) => content,
        Err(e) => {
            error!("Error reading source short URL: {}", e);
            return Err(JsValue::from_str(&format!(
                "Error reading source short URL: {}",
                e
            )));
        }
    };

    // Parse short URL data
    let mut short_url_data: ShortUrlData = match serde_json::from_slice(&content) {
        Ok(data) => data,
        Err(e) => {
            error!("Error parsing short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Invalid short URL data: {}", e)));
        }
    };

    // Update the custom_id flag based on whether new_id is a custom ID or not
    short_url_data.custom_id = true; // Since we're explicitly moving it, it's a custom ID now

    // Serialize updated data
    let updated_json = match serde_json::to_string(&short_url_data) {
        Ok(json) => json,
        Err(e) => {
            error!("Error serializing updated short URL data: {}", e);
            return Err(JsValue::from_str(&format!("Serialization error: {}", e)));
        }
    };

    // Write to destination
    if let Err(e) = vfs.write_file(&dest_path, updated_json.into_bytes()).await {
        error!("Error writing to destination path: {}", e);
        return Err(JsValue::from_str(&format!(
            "Error creating new short URL: {}",
            e
        )));
    }

    // Delete the source file
    if let Err(e) = vfs.delete_file(&source_path).await {
        error!("Error deleting source short URL: {}", e);
        return Err(JsValue::from_str(&format!(
            "Warning: Created new short URL but failed to delete old one: {}",
            e
        )));
    }

    // Return updated data
    let short_url = get_full_short_url(&request_url, &new_id);
    let response = json!({
        "id": new_id,
        "target_url": short_url_data.target_url,
        "short_url": short_url,
        "created_at": short_url_data.created_at,
        "last_used": short_url_data.last_used,
        "use_count": short_url_data.use_count,
        "custom_id": short_url_data.custom_id,
        "description": short_url_data.description,
        "old_id": id
    });

    Ok(JsValue::from_str(&response.to_string()))
}
