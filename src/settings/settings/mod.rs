/// Settings module for subconverter-rs
///
/// This module handles loading and processing of configuration settings.
///
/// Example of template variable usage:
///
/// ```rust
/// use libsubconverter::settings::Settings;
/// use libsubconverter::update_settings_from_content;
///
/// // YAML with template variables
/// let yaml_content = r#"
/// common:
///   api_mode: true
/// template:
///   template_path: "./templates"
///   globals:
///     - key: clash_dns_port
///       value: 5353
///     - key: clash_api_port
///       value: 9090
///     - key: singbox_direct_domain
///       value: example.com
/// "#;
///
/// // Update settings
/// # tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap().block_on(async {
/// update_settings_from_content(yaml_content).await.unwrap();
/// # });
///
/// // Access the loaded settings
/// let settings = Settings::current();
/// assert_eq!(settings.template_path, "./templates");
/// ```
///
/// Template variables can be accessed from settings.template_vars HashMap
pub mod conversions;
pub mod ini_settings;
pub mod settings_struct;
pub mod toml_settings;
pub mod yaml_settings;

// Re-export settings types
pub use ini_settings::IniSettings;
pub use settings_struct::*;
pub use toml_settings::TomlSettings;
pub use yaml_settings::YamlSettings;
