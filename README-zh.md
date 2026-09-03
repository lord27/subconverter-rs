# subconverter-rs 使用指南

<div align="center">

<img src="www/public/logo.svg" alt="subconverter-rs logo" width="150">

> 一个高性能代理订阅转换工具，从 C++ 版本的 subconverter 转换为 Rust 实现

[![Rust](https://img.shields.io/badge/language-Rust-orange.svg)](https://www.rust-lang.org/)
[![Status](https://img.shields.io/badge/status-beta-blue.svg)](https://github.com/lonelam/subconverter-rs)
[![GPL-3.0+ License](https://img.shields.io/badge/license-GPL--3.0%2B-blue.svg)](LICENSE)
[![Crates.io](https://img.shields.io/crates/v/subconverter.svg)](https://crates.io/crates/subconverter)
[![Telegram](https://img.shields.io/badge/Telegram-subconverter_rs-blue.svg)](https://t.me/subconverter_rs)

---

A more powerful utility to convert between proxy subscription formats, transformed from the C++ version subconverter! This Rust implementation offers improved performance and reliability while maintaining compatibility with the original.

**⚠️ BETA VERSION AVAILABLE ⚠️** - This project is now in beta. Core features are implemented but may still have some rough edges.

🎉 wasm版本白嫖一键部署：
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/lonelam/subconverter-rs&base=www)

Demo部署，测试时请注意隐私风险：
https://subconverter-rs.netlify.app/

---

## 📥 安装

### 从 GitHub Releases 获取

直接下载并运行辅助脚本 (需要 `curl` 和 `jq`):

```bash
curl -sSL https://raw.githubusercontent.com/lonelam/subconverter-rs/main/scripts/setup_and_run_subconverter.sh | bash
```
此命令会下载最新版本，解压到 `subconverter` 目录，并启动服务。

(或手动从 [Releases](https://github.com/lonelam/subconverter-rs/releases/latest) 下载)。

### Docker
```bash
docker pull lonelam/subconverter-rs
docker run -d -p 25500:25500 lonelam/subconverter-rs
```

### 从 Crates.io 获取
```bash
cargo install subconverter
```

### 从源码编译
```bash
git clone https://github.com/lonelam/subconverter-rs.git
cd subconverter-rs
cargo build --release --features=web-api
```
二进制文件将位于 `target/release/subconverter`。

**Cargo features：**
- `web-api` — 编译原生 HTTP 服务端（actix-web）。
- `js-runtime` — 启用内置 JS 引擎，使 `filter_script` / `sort_script` 参数生效（默认关闭，出于安全考虑）。

如需 WASM 构建，见 [Library-and-WASM](wiki/Library-and-WASM.md) 与文末 Web UI 章节。

---

* * *

## 📚 文档

完整使用文档见 **[项目 Wiki](https://github.com/lonelam/subconverter-rs/wiki)** —— 快速开始（二进制/Docker/源码）、`/sub` 完整参数表、协议与目标格式支持矩阵、进阶用法（外部配置、节点筛选语法）以及库/WASM 集成方式。Wiki 源文件随代码版本化在仓库的 [`wiki/`](wiki/) 目录。

## 📋 目录

- [特性概览](#特性概览)
- [支持类型](#支持类型)
- [简易用法](#简易用法)
- [进阶用法](#进阶用法)
- [配置文件](#配置文件)
- [外部配置](#外部配置)
- [模板功能](#模板功能)
- [特别用法](#特别用法)
- [Web UI（Next.js 前端）](#-web-ui)

* * *

## 支持类型

### 协议与规则类型支持矩阵

下表展示了不同代理协议在各种规则类型中的支持情况：

| 协议 \ 规则类型 | Clash | SingBox | Surge(2,3,4) | V2Ray | Quantumult | Quantumult X | Loon | Surfboard | Mellow | SIP002/8 | 混合(Mixed) | 类TG代理 |
|--------------|:-----:|:-------:|:-----:|:-----:|:----------:|:------------:|:----:|:---------:|:------:|:--------:|:----------:|:-----:|
| AnyTLS       | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⬇️ | ⬇️ |
| VLESS        | ✅ | ✅ | ⚠️ | ✅ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⬇️ | ⬇️ |
| Hysteria/2   | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⬇️ | ⬇️ |
| VMess        | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ⬇️ |
| Trojan       | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ⬇️ |
| SS           | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ⬇️ |
| SSR          | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ⬇️ |
| HTTP/SOCKS   | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⬇️ | ⬇️ |
| WireGuard    | ✅ | ✅ | ⚠️ | ⬇️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⬇️ | ⬇️ |
| Snell        | ✅ | ❌ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⬇️ | ⬇️ |
| TUIC         | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⬇️ | ⬇️ |
| SSD          | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ⬇️ | ❌ | ⬇️ |

**图例说明：**
- ✅ 完全支持（输入和输出均支持）
- ⚠️ 部分支持（未经测试）
- ⬇️ 仅支持作为输入源
- ⬆️ 仅支持作为输出目标
- ❌ 不支持

**备注：**
1. Shadowrocket 用户可以使用 `ss`、`ssr`、`v2ray` 和 `mixed` 参数
2. 类 TG 代理的 HTTP/Socks 链接由于没有命名设定，所以可以在后方插入 `&remarks=` 进行命名，同时也可以插入 `&group=` 设置组别名称，这两个参数需要经过 [URLEncode](https://www.urlencoder.org/) 处理
3. 目标类型为 `mixed` 时，会输出所有支持的节点的单链接组成的普通订阅（Base64编码）
4. 🚧目标类型为 `auto` 时，会根据请求的 `User-Agent` 自动判断输出的目标类型
5. 上表仅为快速概览，个别单元格可能滞后于实现；逐格最新状态请以源码 / golden 测试与 Wiki 的 [Protocols-and-Targets](wiki/Protocols-and-Targets.md) 页面为准。

* * *

## 🛣️ 现状与路线

> 原生 HTTP 服务当前只提供 `/sub`、`/surge2clash` 与 `/{target}` 速写端点；其余能力通过 WASM 构建与 Web UI 提供，或仍在推进中（详见 [Library-and-WASM](wiki/Library-and-WASM.md)）。

原「未来计划」中的条目均已完成：

- ✅ **Gist 自动发布**：`upload=true` 并配置 `gistconf.ini` 后，生成结果会以私有 Gist 上传并返回地址。
- ✅ **AnyTLS 协议支持**：已完成 `anytls://` 输入解析，并支持输出到 Clash / SingBox。
- ✅ **可视化规则组 / 规则集配置**：Web UI 的转换页与配置编辑器中提供图形化编辑（见 [Web UI](#-web-ui)）。

* * *

## 特性概览

| 功能 | 状态 | 说明 |
|------|:----:|------|
| 核心转换引擎 | ✅ | 代理解析与格式间转换（含 TUIC / AnyTLS / VLESS / Hysteria2 等） |
| 节点操作 | ✅ | 过滤、重命名、排序与预处理节点 |
| 配置文件支持 | ✅ | 支持 INI/YAML/TOML（`pref.toml` / `pref.yml` / `pref.ini`） |
| 命令行接口 | ✅ | `subconverter --url … --output …` 单次转换，或直接启动服务 |
| 节点过滤 | ✅ | 基于备注 / 正则过滤；JS 脚本过滤需 `js-runtime` feature |
| Emoji 支持 | ✅ | 向节点备注添加 / 移除 Emoji |
| 重命名规则 | ✅ | 基于自定义规则重命名节点 |
| 模板系统 | ✅ | 可自定义模板（INJA 风格语法） |
| 规则 / 规则集转换 | 🚧 | 能力保留在核心模块与 WASM API 中 |
| HTTP 服务器 | ✅ | 提供 `/sub`、`/surge2clash`、`/{target}` 端点 |
| 自动上传到 Gist | ✅ | 配置 `gistconf.ini` 后，`upload=true` 生效 |
| WebAssembly | ✅ | 同一引擎可编译为 WASM，浏览器 / Node / Serverless 运行 |
| Web UI | ✅ | Next.js 前端：转换、短链接、配置编辑、中英文界面 |
| 短链接 | ✅ | 生成与管理分享短链（Vercel KV / Netlify Blobs / localStorage） |

图例:
- ✅ 完全实现
- 🚧 部分实现 / 施工中
- ⚠️ 有限支持（如需额外编译 feature）
- ❌ 尚未实现 / 已废弃

## 简易用法

> 即生成的订阅使用**默认设置**

### 调用地址

```txt
http://127.0.0.1:25500/sub?target=%TARGET%&url=%URL%&config=%CONFIG%
```

### 调用说明

| 调用参数 | 必要性 | 示例 | 解释 | 状态 |
| ------ | :--: | :--- | ---- | :---: |
| target | 必要 | surge&ver=4 | 指想要生成的配置类型，详见上方 [支持类型](#支持类型) 中的参数 | ✅ |
| url | 必要 | https%3A%2F%2Fwww.xxx.com | 指机场所提供的订阅链接或代理节点的分享链接，需要经过 [URLEncode](https://www.urlencoder.org/) 处理 | ✅ |
| config | 可选 | https%3A%2F%2Fwww.xxx.com | 指外部配置的地址 (包含分组和规则部分)，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，详见 [外部配置](#外部配置)，当此参数不存在时使用程序的主程序目录中的配置文件 | ✅ |
| flavor | 可选 | premium / stash | 目标 Clash 内核流派，默认 mihomo（完整特性集）；premium 与 stash 会自动剔除对应客户端无法加载的协议与字段（如 Premium 不支持 VLESS/Hysteria2，Stash 不支持 uTLS 指纹） | ✅ |

原生 HTTP 服务（以 `--features=web-api` 编译）提供以下端点：

| 端点 | 说明 |
| ---- | ---- |
| `/sub` | 功能完整的订阅转换（参数见上表） |
| `/surge2clash` | Surge 订阅 → Clash 节点列表（`?link=...`，无需 URLEncode） |
| `/{target}` | `/sub` 的速写形式：target 取自路径（如 `/clash?url=...`） |

运行 subconverter-rs 主程序后，按照 [调用说明](#调用说明) 的对应内容替换即可得到一份使用**默认设置**的订阅。

### 简易转换示例

<details>
<summary><b>处理单份订阅</b></summary>

如果你需要将一份 Surge 订阅转换成 Clash 的订阅, 可以按以下操作：

```txt
有以下一个订阅，且想转换成 Clash 的订阅:
1. https://dler.cloud/subscribe/ABCDE?surge=ss

首先将订阅通过 URLEncode 后可以得到:
https%3A%2F%2Fdler.cloud%2Fsubscribe%2FABCDE%3Fsurge%3Dss

然后将想要的 %TARGET% (即 Clash) 和上一步所得到的 %URL% 填入调用地址中:
http://127.0.0.1:25500/sub?target=clash&url=https%3A%2F%2Fdler.cloud%2Fsubscribe%2FABCDE%3Fsurge%3Dss

最后将该链接填写至 Clash 的订阅处就大功告成了。
```

</details>

<details>
<summary><b>处理多份订阅</b></summary>

如果你需要将多个订阅合成一份, 则要在上方所提及的 URLEncode 之前使用 '|' 来分隔链接, 可以按以下操作：

```txt
有以下两个订阅，且想合并转换成 Clash 的订阅:
1. https://dler.cloud/subscribe/ABCDE?clash=vmess
2. https://rich.cloud/subscribe/ABCDE?clash=vmess

首先使用 '|' 将两个订阅分隔开:
https://dler.cloud/subscribe/ABCDE?clash=vmess|https://rich.cloud/subscribe/ABCDE?clash=vmess

接着通过 URLEncode 后可以得到:
https%3A%2F%2Fdler.cloud%2Fsubscribe%2FABCDE%3Fclash%3Dvmess%7Chttps%3A%2F%2Frich.cloud%2Fsubscribe%2FABCDE%3Fclash%3Dvmess

然后将想要的 %TARGET% (即 Clash) 和上一步所得到的 %URL% 填入调用地址中:
http://127.0.0.1:25500/sub?target=clash&url=https%3A%2F%2Fdler.cloud%2Fsubscribe%2FABCDE%3Fclash%3Dvmess%7Chttps%3A%2F%2Frich.cloud%2Fsubscribe%2FABCDE%3Fclash%3Dvmess

最后将该链接填写至 Clash 的订阅处就大功告成了。
```

</details>

<details>
<summary><b>处理单个节点</b></summary>

如果你需要将自建的一条 SS 的 SIP002 链接转换成 Clash 的订阅, 可以按以下操作：

```txt
有以下自建的一条 SS 的 SIP002 链接，且想转换成 Clash 的订阅:
1. ss://YWVzLTEyOC1nY206dGVzdA==@192.168.100.1:8888#Example1

首先将订阅通过 URLEncode 后可以得到:
ss%3A%2F%2FYWVzLTEyOC1nY206dGVzdA%3D%3D%40192%2E168%2E100%2E1%3A8888%23Example1

然后将想要的 %TARGET% (即 Clash) 和上一步所得到的 %URL% 填入调用地址中:
http://127.0.0.1:25500/sub?target=clash&url=ss%3A%2F%2FYWVzLTEyOC1nY206dGVzdA%3D%3D%40192%2E168%2E100%2E1%3A8888%23Example1

最后将该链接填写至 Clash 的订阅处就大功告成了。
```

</details>

### Surge转Clash快捷转换

当机场提供的 Surge 配置足以满足需求，但额外需要使用 Clash 订阅时，此时可以使用以下方式进行转换

```txt
http://127.0.0.1:25500/surge2clash?link=Surge的订阅链接
```

此处 `Surge的订阅链接`**不需要进行URLEncode**，且**无需任何额外配置**。

* * *

## 进阶用法

> 在不满足于本程序所提供的默认规则或者对应的分组时，可以考虑尝试进阶用法
>
> 即对 `调用地址` 甚至程序目录下的 `配置文件` 进行个性化的编辑以满足不同的需求

### 阅前提示

在进行下一步操作前，十分推荐您阅读以下内容：

1. 与调用地址相关的：[什么是URL？](https://developer.mozilla.org/zh-CN/docs/Learn/Common_questions/What_is_a_URL)
2. 与配置文件相关的：[INI 语法介绍](https://zh.wikipedia.org/wiki/INI%E6%96%87%E4%BB%B6)、[YAML 语法介绍](https://zh.wikipedia.org/wiki/YAML#%E8%AA%9E%E6%B3%95)以及[TOML 语法介绍](https://toml.io/cn/v1.0.0)
3. 与 `Clash` 配置相关的：[官方文档](https://github.com/Dreamacro/clash/wiki/configuration)
4. 与 `模板` 配置相关的：[INJA 语法介绍](https://github.com/pantor/inja)
5. 会经常涉及到的：[正则表达式入门](https://github.com/ziishaned/learn-regex/blob/master/translations/README-cn.md)

当您尝试进行进阶操作时，即默认您有相关的操作能力，本程序仅保证在默认配置文件下能够正常运行。

### 进阶链接

#### 调用地址 (进阶)

```txt
http://127.0.0.1:25500/sub?target=%TARGET%&url=%URL%&emoji=%EMOJI%····
```

#### 调用说明 (进阶)

| 调用参数 | 必要性 | 示例 | 解释 | 状态 |
| ------- | :--: | :--- | ---- | :---: |
| target | 必要 | surge&ver=4 | 指想要生成的配置类型，详见上方 [支持类型](#支持类型) 中的参数 | ✅ |
| url | 可选 | https%3A%2F%2Fwww.xxx.com | 指机场所提供的订阅链接或代理节点的分享链接，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，**可选的前提是在 `default_url` 中进行指定**。也可以使用 data URI。可使用 `tag:xxx,https%3A%2F%2Fwww.xxx.com` 指定该订阅的所有节点归属于`xxx`分组，用于配置文件中的`!!GROUP=XXX` 匹配 | ✅ |
| group | 可选 | MySS | 用于设置该订阅的组名，多用于 SSD/SSR | ✅ |
| upload_path | 可选 | MySS.yaml | 用于设置上传至 `Gist` 后生成的文件名，需要经过 [URLEncode](https://www.urlencoder.org/) 处理 | ✅ |
| include | 可选 | 详见下文中 `include_remarks` | 指仅保留匹配到的节点，支持正则匹配，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，会覆盖配置文件里的设置 | ✅ |
| exclude | 可选 | 详见下文中 `exclude_remarks` | 指排除匹配到的节点，支持正则匹配，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，会覆盖配置文件里的设置 | ✅ |
| config | 可选 | https%3A%2F%2Fwww.xxx.com | 指外部配置的地址 (包含分组和规则部分)，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，详见 [外部配置](#外部配置)，当此参数不存在时使用主程序目录中的配置文件 | ✅ |
| dev_id | 可选 | 92DSAFA | 用于设置 QuantumultX 的远程设备 ID（参数已解析，但当前版本尚未启用） | ❌ |
| filename | 可选 | MySS | 指定所生成订阅的文件名，可以在 Clash For Windows 等支持文件名的软件中显示出来 | ✅ |
| interval | 可选 | 43200 | 用于设置托管配置更新间隔，确定配置将更新多长时间，单位为秒 | 🚧 |
| rename | 可选 | 详见下文中 `rename` | 用于自定义重命名，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，会覆盖配置文件里的设置 | ✅ |
| filter_script | 可选 | 详见下文中 `filter_script` | 用于自定义筛选节点的js代码，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，会覆盖配置文件里的设置。出于安全考虑，链接需包含正确的 `token` 参数，才会应用该设置 | ⚠️ |
| strict | 可选 | true / false | 如果设置为 true，则 Surge 将在上述间隔后要求强制更新 | 🚧 |
| upload | 可选 | true / false | 用于将生成的订阅文件上传至 `Gist`，需要填写`gistconf.ini`，默认为 false（即不上传），详见 [自动上传](#自动上传) | ✅ |
| emoji | 可选 | true / false | 用于设置节点名称是否包含 Emoji，默认为 true | ✅ |
| add_emoji | 可选 | true / false | 用于在节点名称前加入 Emoji，默认为 true | ✅ |
| remove_emoji | 可选 | true / false | 用于设置是否删除节点名称中原有的 Emoji，默认为 true | ✅ |
| append_type | 可选 | true / false | 用于在节点名称前插入节点类型，如 `[SS]`,`[SSR]`等 | ✅ |
| tfo | 可选 | true / false | 用于开启该订阅链接的 TCP Fast Open，默认为 false | ✅ |
| udp | 可选 | true / false | 用于开启该订阅链接的 UDP，默认为 false | ✅ |
| list | 可选 | true / false | 用于输出 Surge Node List 或者 Clash Proxy Provider 或者 Quantumult (X) 的节点订阅 或者 解码后的 SIP002 | ✅ |
| sort | 可选 | true / false | 用于对输出的节点或策略组按节点名进行再次排序，默认为 false | ✅ |
| sort_script | 可选 | 详见下文 `sort_script` | 用于自定义排序的js代码，需要经过 [URLEncode](https://www.urlencoder.org/) 处理，会覆盖配置文件里的设置。出于安全考虑，链接需包含正确的 `token` 参数，才会应用该设置 | ⚠️ |
| script | 可选 | true / false | 用于生成Clash Script，默认为 false | ❌ |
| insert | 可选 | true / false | 用于设置是否将配置文件中的 `insert_url` 插入，默认为 true | ✅ |
| scv | 可选 | true / false | 用于关闭 TLS 节点的证书检查，默认为 false | ✅ |
| fdn | 可选 | true / false | 用于过滤目标类型不支持的节点，默认为 true | ✅ |
| expand | 可选 | true / false | 用于在 API 端处理或转换 Surge, QuantumultX, Clash 的规则列表，即是否将规则全文置入订阅中，默认为 true，设置为 false 则不会将规则全文写进订阅 | ✅ |
| append_info | 可选 | true / false | 用于输出包含流量或到期信息的节点, 默认为 true，设置为 false 则取消输出 | ❌ |
| prepend | 可选 | true / false | 用于设置插入 `insert_url` 时是否插入到所有节点前面，默认为 true | ✅ |
| classic | 可选 | true / false | 用于设置是否生成 Clash classical rule-provider | ⚠️ |
| tls13 | 可选 | true / false | 用于设置是否为节点增加tls1.3开启参数 | ✅ |

> 上表为常用参数对照；`upload` / `upload_path` 上传结果到 Gist（需先配置 `gistconf.ini`），`filter_script` / `sort_script` 需以 `--features=js-runtime` 编译才会真正执行，`dev_id` 当前版本解析但不生效。完整参数参考见 Wiki [HTTP-API](wiki/HTTP-API.md)。

### 配置档案 / 保存配置

> 把常用参数保存为档案，可以避免每次都拼接冗长的订阅链接。

在 Web UI 中可保存/管理配置档案与分享短链（见 [Web UI](#-web-ui)）；历史上 C++ 版的 `/getprofile` 等端点在本 Rust 版本的原生 HTTP 服务中**暂不暴露**（相关能力正在 WASM / Serverless 架构下重构，参见 [Library-and-WASM](wiki/Library-and-WASM.md) 与源码 `src/api/`）。

### 配置文件

> 关于 subconverter-rs 主程序目录中配置文件的解释

本程序可以使用多种格式的配置文件，按照 `pref.toml`、`pref.yml`、`pref.ini` 的优先级顺序加载。

<details>
<summary><b>[common] 部分</b></summary>

> 该部分主要涉及到的内容为 **全局的节点排除或保留** 、**各配置文件的基础**
>
> 其他设置项目可以保持默认或者在知晓作用的前提下进行修改

支持的主要配置项包括：
- api_mode：API 模式设置
- api_access_token：用于访问隐私接口的令牌
- default_url：默认加载的订阅链接
- enable_insert：是否添加插入节点
- insert_url：插入节点的地址
- exclude_remarks：排除匹配到的节点
- include_remarks：仅保留匹配到的节点
- enable_filter：是否使用自定义JS过滤节点
- filter_script：自定义的JS过滤函数
- default_external_config：默认外部配置文件
- clash_rule_base：Clash 配置模板
- surge_rule_base：Surge 配置模板
- append_proxy_type：是否在节点名称前加入类型标识

状态：⚠️ 大部分实现, js脚本尚不支持

</details>

<details>
<summary><b>[userinfo] 部分</b></summary>

> 该部分主要涉及到的内容为 **从节点名中提取用户信息的规则**

支持的主要配置项包括：
- stream_rule：从节点名中提取流量信息的规则
- time_rule：从节点名中提取时间信息的规则

状态：⚠️ 未测试

</details>

<details>
<summary><b>[node_pref] 部分</b></summary>

> 该部分主要涉及到的内容为 **开启节点的 UDP 及 TCP Fast Open** 、**节点的重命名** 、**重命名节点后的排序**

支持的主要配置项包括：
- udp_flag：为节点打开 UDP 模式
- tcp_fast_open_flag：为节点打开 TFO 模式
- skip_cert_verify_flag：关闭 TLS 节点的证书检查
- tls13_flag：为节点增加tls1.3开启参数
- sort_flag：对节点按名称进行排序
- append_sub_userinfo：是否附加流量信息
- clash_use_new_field_name：是否使用 Clash 的新区块名称
- clash_proxies_style：Clash配置文件的格式风格
- rename_node：重命名节点的规则

状态：✅ 已实现

</details>

<details>
<summary><b>[managed_config] 部分</b></summary>

> 该部分主要涉及到的内容为 **订阅文件的更新地址**

支持的主要配置项包括：
- write_managed_config：是否将管理信息附加到配置
- managed_config_prefix：管理配置的前缀地址
- config_update_interval：托管配置更新间隔
- config_update_strict：是否强制更新配置

状态：🚧 部分实现

</details>

<details>
<summary><b>[emojis] 部分</b></summary>

> 该部分主要涉及添加和删除 Emoji

支持的主要配置项包括：
- add_emoji：是否添加自定义 Emoji
- remove_old_emoji：是否移除原有 Emoji
- rule：匹配节点并添加 Emoji 的规则

状态：✅ 已实现

</details>

<details>
<summary><b>[ruleset] 部分</b></summary>

> 该部分主要涉及自定义规则集

支持的主要配置项包括：
- enabled：是否启用自定义规则集
- overwrite_original_rules：是否覆盖原有规则
- update_ruleset_on_request：是否根据请求更新规则集
- ruleset：规则集定义

状态：✅ 已实现

</details>

<details>
<summary><b>[proxy_group] 部分</b></summary>

> 该部分主要涉及创建策略组

支持的主要配置项包括：
- custom_proxy_group：自定义策略组定义

状态：✅ 已实现

</details>

<details>
<summary><b>[template] 部分</b></summary>

> 该部分主要涉及模板系统设置

支持的主要配置项包括：
- template_path：子模板文件的路径限制
- 自定义模板参数

状态：✅ 已实现

</details>

### 外部配置

> 本部分用于链接参数 **`&config=`**（✅ 已实现）

将配置文件上传至 GitHub Gist 或其他**可访问**网络位置，经过 [URLEncode](https://www.urlencoder.org/) 处理后添加至 `&config=` 即可调用；也可以直接使用**仓库内置**的预置配置（`base/config` 目录，如 Web UI 下拉列表中的 ACL4SSR / Aethersailor 等预设）。

注意：由外部配置中所定义的值会**覆盖**主程序目录中配置文件里的内容

### 模板功能

> 模板功能可以通过设置不同的条件参数来获取对应的模板内容（🚧 部分实现）

#### 模板调用

当前模板调用可以用于[外部配置](#外部配置)和各类 base 文件中。

模板语法主要基于 [INJA 语法](https://github.com/pantor/inja)，支持条件判断、循环和变量引用等功能。

#### 直接渲染

> 注：C++ 版的 `/render` 端点在本 Rust 版本的原生 HTTP 服务中暂不暴露；模板渲染能力仍保留在核心模块（WASM / 库 API，见 [Library-and-WASM](wiki/Library-and-WASM.md)）。

## 特别用法

### 命令行本地生成

无需启动服务，直接把完整的请求 URL 交给引擎并写出到文件即可（旧版 `generate.ini` / `-g` 参数已移除）：

```bash
subconverter \
  --config pref.ini \
  --url "/sub?target=clash&url=https%3A%2F%2Fexample.com%2Fsubscribe%2FABCDE" \
  --output output.yaml
```

其他命令行参数：`--address <地址>` / `--port <端口>`（以服务方式运行时覆盖监听地址）。

### 自动上传

> 自动上传生成的配置到 GitHub Gist（✅ 已实现）

先在程序目录下准备 `gistconf.ini`（Gist 上传配置），然后在请求中添加 `upload=true`（可选 `upload_path=文件名`）。转换完成后结果会自动以**私有 Gist** 上传，API 响应中返回其地址；未配置凭据时上传会被跳过。

### 规则转换

> 将规则转换为指定的规则类型（❌ 原生 HTTP 端点暂未提供）

> 注：C++ 版的 `/getruleset` 端点在本 Rust 版本的原生 HTTP 服务中暂不暴露；规则集处理与转换能力仍保留在核心模块与 WASM / 库 API 中（见 [Library-and-WASM](wiki/Library-and-WASM.md)）。

---

## 🖥️ Web UI

> 官方前端位于 [`www/`](www/) —— 基于 Next.js（React + Tailwind CSS + next-intl）的现代化界面，提供**简体中文 / English** 双语。转换使用**与 Rust 核心同一份代码编译出的 WebAssembly 引擎**，因此托管实例无需任何代理后端即可完成转换。

在线 Demo（测试时请注意隐私风险）：<https://subconverter-rs.netlify.app/> （也可用文档顶部的一键部署按钮自建实例）

### 界面能力

- **转换器页面**：暴露 `/sub` 的全部选项（目标格式、外部配置预设、过滤与重命名、输出与协议选项、高级字段），表单分组支持点击标题收叠，便于使用；
- **短链接**：创建、管理与分享转换配置的短链，落地页（`/s/<id>`）可按访问者客户端自动转换；
- **配置编辑**：可视化编辑自定义策略组与规则集，外部配置可直接选用仓库内置的 `base/config` 预设（构建时自动生成下拉列表）；
- **下载 / 设置 / 管理**：下载中心、参数设置与后台管理页面，以及 WASM 冒烟测试页；
- [`www-examples/`](www-examples/) 提供最小的 WASM / Serverless 集成示例。

### 部署形态

| 形态 | 构建命令 | 数据路径 |
| ---- | ---- | ---- |
| **托管模式**（Vercel / Netlify） | `pnpm build` | Next.js Route Handler 在服务端加载 WASM 引擎；配置与短链存于 Vercel KV / Netlify Blobs |
| **纯静态导出** | `STATIC_EXPORT=true pnpm build:static`（输出 `dist/`） | WASM 完全在浏览器内运行；短链与编辑文件以 localStorage 持久化，任意静态托管（GitHub Pages / Nginx / S3…）皆可 |
| **静态 + 自托管 API** | `STATIC_EXPORT=true STATIC_EXPORT_API=true pnpm build:static` | 静态页调用 `/api/*`，由 Nginx 等反代到以 SQLite 为存储的 Node 后端 |

### 本地开发

```bash
cd www
pnpm install
pnpm dev            # 打开 http://localhost:3000
pnpm build:static   # 纯静态产物 dist/
```

`dev` / `build` 脚本会先注入 SQLite 版 KV 兼容层（`www/scripts/apply-kv-sqlite.mjs`），并扫描仓库 `base/config` 重新生成外部配置下拉列表（`www/scripts/generate-external-config-list.mjs`）。

WASM 产物来自本仓库的 Rust 核心：

```bash
./scripts/build-wasm.sh          # → pkg/（供 npm 包 subconverter-wasm 使用）
./scripts/build-wasm-browser.sh  # 浏览器版 → www/vendor/subconverter-wasm-browser
```

详见 [www/README.md](www/README.md) 与 Wiki 的 [Library-and-WASM](wiki/Library-and-WASM.md)。
