# subconverter-rs

<div align="center">

<img src="www/public/logo.svg" alt="subconverter-rs logo" width="150">

> Transform. Optimize. Simplify. A blazingly fast proxy subscription converter rewritten in Rust.

[![Rust](https://img.shields.io/badge/language-Rust-orange.svg)](https://www.rust-lang.org/)
[![Status](https://img.shields.io/badge/status-beta-blue.svg)](https://github.com/lonelam/subconverter-rs)
[![GPL-3.0+ License](https://img.shields.io/badge/license-GPL--3.0%2B-blue.svg)](LICENSE)
[![Crates.io](https://img.shields.io/crates/v/subconverter.svg)](https://crates.io/crates/subconverter)
[![Telegram](https://img.shields.io/badge/Telegram-subconverter_rs-blue.svg)](https://t.me/subconverter_rs)
[![Netlify Status](https://api.netlify.com/api/v1/badges/35e931d3-b058-466e-88a5-e80247c5efd5/deploy-status)](https://app.netlify.com/sites/subconverter-rs/deploys)
[![GitHub stars](https://img.shields.io/github/stars/lonelam/subconverter-rs?style=social)](https://github.com/lonelam/subconverter-rs/stargazers)

</div>

---

A more powerful utility to convert between proxy subscription formats, transformed from the C++ version subconverter! This Rust implementation offers improved performance and reliability while maintaining compatibility with the original.

**⚠️ BETA VERSION AVAILABLE ⚠️** - This project is now in beta. Core features are implemented but may still have some rough edges.

🎉 wasm版本白嫖一键部署：
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/lonelam/subconverter-rs&base=www)

Demo部署，测试时请注意隐私风险：
https://subconverter-rs.netlify.app/

---

## 📋 Table of Contents

- [Features](#-features)
- [Protocol Support Matrix](#-protocol-support-matrix)
- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [Advanced Usage](#-advanced-usage)
- [Configuration](#️-configuration)
- [Web UI and WASM](#-web-ui-and-wasm)
- [Development](#-development)
- [Contributors](#-contributors)
- [License](#-license)

---

## ✨ Features

- High-performance subscription conversion with Rust's speed and safety
- Broad protocol coverage — SS/SSR, VMess, VLESS, Trojan (incl. Trojan-Go), Hysteria/2, TUIC, AnyTLS, WireGuard, Snell, HTTP/SOCKS and more
- Flexible node filtering, renaming, and emoji addition
- Customizable templates, rule sets and proxy groups
- HTTP server exposing `/sub`, `/surge2clash` and `/{target}` endpoints
- Optional automatic publishing of generated configs to GitHub Gist
- Compiles to WebAssembly — the same engine runs natively, in Node.js, or in the browser
- Official Web UI (Next.js) with short links, visual config / rule-group editors and i18n (EN/中文)
- Compatible with original subconverter configuration

---

## 📊 Protocol Support Matrix

The following table shows the support status of different proxy protocols in various rule types:

| Protocol \ Rule Type | Clash | SingBox | Surge(2,3,4) | V2Ray | Quantumult | Quantumult X | Loon | Surfboard | Mellow | SIP002/8 | Mixed | TG-like |
|----------------------|:-----:|:-------:|:------------:|:-----:|:----------:|:------------:|:----:|:---------:|:------:|:--------:|:----------:|:-------:|
| AnyTLS               | ✅    | ❌      | ❌           | ❌    | ❌         | ❌           | ❌   | ❌        | ❌     | ❌       | ⬇️         | ⬇️      |
| VLESS                | ✅    | ✅      | ⚠️           | ✅    | ❌         | ⚠️           | ⚠️   | ❌        | ❌     | ❌       | ⬇️         | ⬇️      |
| Hysteria/2           | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ❌       | ⬇️         | ⬇️      |
| VMess                | ✅    | ✅      | ⚠️           | ✅    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ❌       | ✅         | ⬇️      |
| Trojan               | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ❌       | ✅         | ⬇️      |
| SS                   | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ✅       | ✅         | ⬇️      |
| SSR                  | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ❌       | ✅         | ⬇️      |
| HTTP/SOCKS           | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ⚠️     | ❌       | ⬇️         | ⬇️      |
| WireGuard            | ✅    | ✅      | ⚠️           | ⬇️    | ❌         | ⚠️           | ⚠️   | ⚠️        | ❌     | ❌       | ⬇️         | ⬇️      |
| Snell                | ✅    | ❌      | ✅           | ❌    | ❌         | ⚠️           | ⚠️   | ⚠️        | ❌     | ❌       | ⬇️         | ⬇️      |
| TUIC                 | ✅    | ✅      | ⚠️           | ❌    | ⚠️         | ⚠️           | ⚠️   | ⚠️        | ❌     | ❌       | ⬇️         | ⬇️      |
| SSD                  | ⬇️    | ⬇️      | ⬇️           | ⬇️    | ⬇️         | ⬇️           | ⬇️   | ⬇️        | ⬇️     | ⬇️       | ❌         | ⬇️      |

**Legend:**
- ✅ Fully supported (both input and output)
- ⚠️ Partially supported (untested)
- ⬇️ Supported as input source only
- ⬆️ Supported as output target only
- ❌ Not supported

**Notes:**
1. Shadowrocket users can use the `ss`, `ssr`, `v2ray`, and `mixed` parameters.
2. For HTTP/Socks links without naming (TG-like), you can append `&remarks=` for naming and `&group=` for group naming. These parameters need to be [URLEncoded](https://www.urlencoder.org/).
3. When the target type is `mixed`, all supported nodes will be output as a normal subscription (Base64 encoded).
4. The matrix above is a quick overview; some cells may lag behind the implementation. See the wiki page [Protocols-and-Targets](wiki/Protocols-and-Targets.md) for the per-cell status kept up to date with source code and golden tests.

---

## 🛣️ Roadmap

> The native HTTP service currently exposes `/sub`, `/surge2clash` and a `/{target}` shorthand. Everything else listed below is reachable through the WASM build / Web UI, or is still in progress — see [Library-and-WASM](wiki/Library-and-WASM.md).

Recently completed / available features:

- ✅ **Gist Publishing**: `upload=true` + `gistconf.ini` uploads the generated config to a GitHub Gist (returned in the API response).
- ✅ **AnyTLS Support**: input parsing (`anytls://`) and Clash / SingBox output are implemented.
- ✅ **Visual Rule Group & Ruleset Configuration**: available in the Web UI's config editors (see [Web UI and WASM](#-web-ui-and-wasm)).

---

## 📥 Installation

### From GitHub Releases

Download and run the helper script directly (requires `curl` and `jq`):

```bash
curl -sSL https://raw.githubusercontent.com/lonelam/subconverter-rs/main/scripts/setup_and_run_subconverter.sh | bash
```
This downloads the latest release, extracts it to a `subconverter` directory, and starts the server.

(Or manually download from [Releases](https://github.com/lonelam/subconverter-rs/releases/latest)).

### Docker
```bash
docker pull lonelam/subconverter-rs
docker run -d -p 25500:25500 lonelam/subconverter-rs
```

### From Crates.io
```bash
cargo install subconverter
```

### From Source
```bash
git clone https://github.com/lonelam/subconverter-rs.git
cd subconverter-rs
cargo build --release --features=web-api
```
The binary will be available at `target/release/subconverter`.

**Cargo features:**
- `web-api` — build the native HTTP server binary (actix-web).
- `js-runtime` — enable the built-in JS engine so `filter_script` / `sort_script` parameters take effect (default off for safety).

For a WASM build, see [Library-and-WASM](wiki/Library-and-WASM.md) or the Web UI section below.

---

## 📚 Documentation

Full usage documentation is on the **[project wiki](https://github.com/lonelam/subconverter-rs/wiki)** — getting started (binary/Docker/source), the complete `/sub` parameter reference, protocol/target support matrices, advanced usage (external configs, node filtering syntax) and library/WASM integration. The wiki source is versioned in [`wiki/`](wiki/) in this repo.

## 🔰 Basic Usage

### API Endpoint

```http
http://127.0.0.1:25500/sub?target=%TARGET%&url=%URL%&config=%CONFIG%
```

The native HTTP server (built with `--features=web-api`) exposes:

| Endpoint             | Description                                                            |
|----------------------|------------------------------------------------------------------------|
| `/sub`               | Full-featured subscription conversion (see parameters below)           |
| `/surge2clash`       | Surge subscription → Clash node list (`?link=...`, no URL-encoding needed) |
| `/{target_type}`     | Shorthand for `/sub` with `target` taken from the path (e.g. `/clash?url=...`) |

> In the WASM / Web UI deployments the conversion runs through the same engine but is invoked differently — see [Web UI and WASM](#-web-ui-and-wasm).

### Parameters

| Parameter | Required | Example                     | Description                       | Status |
|-----------|:--------:|-----------------------------|-----------------------------------|:------:|
| `target`  | Yes      | `surge&ver=4`               | Target configuration type         | ✅     |
| `url`     | Yes      | `https%3A%2F%2Fwww.xxx.com` | Subscription link (URLEncoded)    | ✅     |
| `config`  | No       | `https%3A%2F%2Fwww.xxx.com` | External configuration (URLEncoded) | ✅     |
| `flavor`  | No       | `premium` / `stash`         | Clash flavor to target. Defaults to mihomo (full feature set); `premium` and `stash` drop protocols and fields the client cannot load (e.g. VLESS/Hysteria2 on Premium, uTLS fingerprints on Stash) | ✅     |

### Simple Conversion Examples

<details>
<summary><b>Converting a Single Subscription</b></summary>

```http
# Original subscription: https://example.com/subscribe/ABCDE?surge=ss
# URLEncoded: https%3A%2F%2Fexample.com%2Fsubscribe%2FABCDE%3Fsurge%3Dss

http://127.0.0.1:25500/sub?target=clash&url=https%3A%2F%2Fexample.com%2Fsubscribe%2FABCDE%3Fsurge%3Dss
```
</details>

<details>
<summary><b>Combining Multiple Subscriptions</b></summary>

```http
# Original subscriptions:
# 1. https://example1.com/subscribe/ABCDE?clash=vmess
# 2. https://example2.com/subscribe/ABCDE?clash=vmess
# Combined with pipe: https://example1.com/subscribe/ABCDE?clash=vmess|https://example2.com/subscribe/ABCDE?clash=vmess
# URLEncoded: https%3A%2F%2Fexample1.com%2Fsubscribe%2FABCDE%3Fclash%3Dvmess%7Chttps%3A%2F%2Fexample2.com%2Fsubscribe%2FABCDE%3Fclash%3Dvmess

http://127.0.0.1:25500/sub?target=clash&url=https%3A%2F%2Fexample1.com%2Fsubscribe%2FABCDE%3Fclash%3Dvmess%7Chttps%3A%2F%2Fexample2.com%2Fsubscribe%2FABCDE%3Fclash%3Dvmess
```
</details>

<details>
<summary><b>Converting a Single Node</b></summary>

```http
# Original node: ss://YWVzLTEyOC1nY206dGVzdA==@192.168.100.1:8888#Example1
# URLEncoded: ss%3A%2F%2FYWVzLTEyOC1nY206dGVzdA%3D%3D%40192%2E168%2E100%2E1%3A8888%23Example1

http://127.0.0.1:25500/sub?target=clash&url=ss%3A%2F%2FYWVzLTEyOC1nY206dGVzdA%3D%3D%40192%2E168%2E100%2E1%3A8888%23Example1
```
</details>

### Quick Surge to Clash Conversion

For quick conversion from Surge to Clash without additional configuration:
```http
http://127.0.0.1:25500/surge2clash?link=SurgeSubscriptionLink
```
*Note: The Surge subscription link does NOT need to be URLEncoded.*

---

## 🔧 Advanced Usage

### Advanced API Parameters

<details>
<summary><b>Click to show all available parameters</b></summary>

| Parameter        | Required | Example     | Description                                          | Status |
|------------------|:--------:|-------------|------------------------------------------------------|:------:|
| `emoji`          | No       | `true`      | Enable emoji in node names                           | ✅     |
| `add_emoji`      | No       | `true`      | Add emoji before node names                          | ✅     |
| `remove_emoji`   | No       | `true`      | Remove existing emoji from node names                | ✅     |
| `append_type`    | No       | `true`      | Add proxy type (`[SS]`, `[SSR]`, etc.) to node names | ✅     |
| `tfo`            | No       | `true`      | Enable TCP Fast Open                                 | ✅     |
| `udp`            | No       | `true`      | Enable UDP support                                   | ✅     |
| `scv`            | No       | `true`      | Skip certificate verification for TLS nodes          | ✅     |
| `tls13`          | No       | `true`      | Enable TLS 1.3 for nodes                             | ✅     |
| `sort`           | No       | `true`      | Sort nodes by name                                   | ✅     |
| `include`        | No       | `(regex)`   | Only include nodes matching the pattern              | ✅     |
| `exclude`        | No       | `(regex)`   | Exclude nodes matching the pattern                   | ✅     |
| `filename`       | No       | `MyConfig`  | Set the file name for the generated config           | ✅     |
| `list`           | No       | `true`      | Output as node list or provider format               | ✅     |
| `insert`         | No       | `true`      | Insert nodes from `insert_url` in config             | ✅     |
| `prepend`        | No       | `true`      | Insert nodes at the beginning                        | ✅     |
</details>

*Notes: the table above is a commonly-used subset. `upload`/`upload_path` upload the
result to a Gist (`gistconf.ini` must be present), while `dev_id` is currently
parsed but not applied. `filter_script`/`sort_script` only take effect when the
binary is built with the `js-runtime` feature. See [HTTP-API](wiki/HTTP-API.md)
for the complete reference.*

---

## ⚙️ Configuration

subconverter-rs supports multiple configuration file formats. It will load configuration in the following priority order: `pref.toml`, `pref.yml`, `pref.ini`.

### Key Configuration Sections

<details>
<summary><b><code>[common]</code> - Global node filtering and base configuration settings</b></summary>

- `api_mode`: API mode settings
- `api_access_token`: Token for accessing private interfaces
- `default_url`: Default subscription links to load
- `enable_insert`: Whether to add insertion nodes
- `insert_url`: URL for insertion nodes
- `exclude_remarks`: Exclude nodes matching the pattern
- `include_remarks`: Only include nodes matching the pattern
- `default_external_config`: Default external configuration file
- `clash_rule_base`: Clash configuration template
- `surge_rule_base`: Surge configuration template
</details>

<details>
<summary><b><code>[userinfo]</code> - Rules for extracting user information from node names</b></summary>

- `stream_rule`: Rules for extracting traffic information
- `time_rule`: Rules for extracting time information
</details>

<details>
<summary><b><code>[node_pref]</code> - Node preferences (UDP, TFO, renaming, sorting)</b></summary>

- `udp_flag`: Open UDP mode for nodes
- `tcp_fast_open_flag`: Open TFO mode for nodes
- `skip_cert_verify_flag`: Turn off certificate checks for TLS nodes
- `tls13_flag`: Add TLS 1.3 parameters for nodes
- `sort_flag`: Sort nodes by name
- `append_sub_userinfo`: Whether to append traffic information
- `clash_use_new_field_name`: Whether to use Clash's new field names
- `clash_proxies_style`: Clash configuration file format style
- `rename_node`: Node renaming rules
</details>

<details>
<summary><b>Additional Sections - <code>[managed_config]</code>, <code>[emojis]</code>, <code>[ruleset]</code>, <code>[proxy_group]</code>, <code>[template]</code></b></summary>

There are several other configuration sections for managed config settings, emoji handling, custom rule sets, proxy groups, and template system settings. See the documentation for detailed information.
</details>

### External Configuration

You can host configuration files on GitHub Gist or other accessible network locations. URL-encode the configuration URL and add it to the `&config=` parameter in your API call. You can also point `config` at one of the **bundled presets** shipped in this repo under `base/config` (ACL4SSR, Aethersailor, …) — the Web UI exposes them in its external-config dropdown.

### Command-Line Conversion

To generate a config without starting the server, pass a full request URL together with an output file:

```bash
subconverter \
  --config pref.ini \
  --url "/sub?target=clash&url=https%3A%2F%2Fexample.com%2Fsubscribe%2FABCDE" \
  --output output.yaml
```

Other CLI flags: `--address <ADDR>` / `--port <PORT>` override the listen
address when running as a server.

---

## 🖥️ Web UI and WASM

The official frontend lives in [`www/`](www/) — a Next.js app (React, Tailwind CSS, `next-intl`) with **English / 中文** UI. It converts subscriptions with **the very same Rust engine compiled to WebAssembly**, so a hosted instance needs no proxy backend for conversion.

- Try the demo: <https://subconverter-rs.netlify.app/> (or deploy it yourself with the one-click Netlify badge at the top).

### What the UI offers

- Full converter page — every `/sub` option is exposed (target, external-config preset, filtering / renaming, output & protocol flags, advanced fields) with collapsible form sections.
- Shareable short links — create, list and manage links; landing page (`/s/<id>`) can auto-convert to the visitor's client.
- Visual config editor — custom proxy groups & rulesets, and external-config selection including the bundled `base/config` presets shipped by this repo.
- Downloads page, settings, admin pages, plus a WASM smoke-test page.
- Monorepo-style tooling: `www-examples/` holds minimal WASM / serverless examples.

### Deployment modes

| Mode | Build | Data path |
|---|---|---|
| **Hosted** (Vercel / Netlify) | `pnpm build` | Next.js Route Handlers load the WASM engine server-side; configs & links stored in Vercel KV / Netlify Blobs |
| **Pure static** | `STATIC_EXPORT=true pnpm build:static` → `dist/` | WASM runs fully in the browser; short links / edited VFS files persist in `localStorage` — host it anywhere (GitHub Pages, Nginx, S3…) |
| **Static + self-hosted API** | `STATIC_EXPORT=true STATIC_EXPORT_API=true pnpm build:static` | static pages call `/api/*`, proxied by e.g. Nginx to a small Node backend whose storage is SQLite |

### Local development

```bash
cd www
pnpm install
pnpm dev            # Next dev server on http://localhost:3000
pnpm build:static   # produce dist/ (pure static mode)
```

The `dev` / `build` scripts first apply a SQLite-backed KV shim
(`www/scripts/apply-kv-sqlite.mjs`) and regenerate the external-config dropdown
list by scanning the repo's `base/config` folder
(`www/scripts/generate-external-config-list.mjs`).

The WASM bundles come from this Rust core:

```bash
./scripts/build-wasm.sh          # pkg/ — used by the npm package subconverter-wasm
./scripts/build-wasm-browser.sh  # browser edition → www/vendor/subconverter-wasm-browser
```

See [www/README.md](www/README.md) and [Library-and-WASM](wiki/Library-and-WASM.md) for details.

---

## 👩‍💻 Development

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1.  **Pick an issue**: Check our [issue tracker](https://github.com/lonelam/subconverter-rs/issues) for tasks labeled `good first issue` or `help wanted`.
2.  **Implement new proxy types**: Help expand support for additional proxy protocols.
3.  **Improve parsing**: Enhance the robustness of the various format parsers.
4.  **Add tests**: Increase test coverage to ensure stability.
5.  **Documentation**: Improve docs or add examples to help others use the project.
6.  **Performance optimizations**: Help make the converter even faster.

---

## ✨ Contributors

<a href="https://github.com/lonelam/subconverter-rs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lonelam/subconverter-rs" />
</a>

---

## 📄 License

This project is licensed under the GPL-3.0+ License - see the [LICENSE](LICENSE) file for details.
