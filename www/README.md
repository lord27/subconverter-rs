# Subconverter Web UI

A modern web UI for the subconverter-rs project, deployable to Vercel with a single click. This project allows you to convert proxy subscriptions to various formats and create shareable links with custom configurations.

## Features

- Convert proxy subscriptions to different formats (Clash, Surge, Quantumult X, etc.)
- Create and save custom configurations
- Generate shareable short links for your configs
- Modern, responsive UI built with Next.js and Tailwind CSS

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later
- [yarn](https://yarn.io/) 8.x or later
- [Rust](https://www.rust-lang.org/) (for building the WebAssembly component)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/laizn/subconverter-rs.git
   cd subconverter-rs
   ```

2. Build the WebAssembly component:
   ```bash
   wasm-pack build --target web --out-dir pkg
   ```

3. Install dependencies for the Vercel app:
   ```bash
   cd vercel
   yarn install
   ```

4. Run the development server:
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
yarn build
```

### Build as Pure Static Site (`dist/`)

The app can also be exported as a **fully static folder** — no server, no
serverless functions. In this mode the subconverter WASM engine runs entirely
inside the browser, short URLs / VFS files are persisted in `localStorage`, and
the output can be hosted on any static host (GitHub Pages, Nginx, S3, …).

```bash
npm run build:static
# or: node scripts/export-static.mjs
```

Output: `dist/`

Notes:

- The build script temporarily moves `src/app/api` (Next.js Route Handlers are
  unsupported with `output: 'export'`) aside and restores it afterwards.
- The browser WASM bundle is committed under `vendor/subconverter-wasm-browser`
  (wasm-pack `--target web`, built from the Rust core). To rebuild it:

  ```bash
  # from the repo root (requires rustup + wasm32-unknown-unknown + wasm-pack)
  wasm-pack build --release --target web --out-dir pkg-web
  # then copy pkg-web/* into www/vendor/subconverter-wasm-browser/
  # and replace its snippets/<hash>/js/kv_bindings.js with
  # www/scripts/browser-kv-bindings.js (browser + localStorage edition)
  ```

- `localStorage` persistence: short links, edited VFS files and download
  configs survive page reloads (degrading to in-memory only when storage is
  unavailable).

## Deployment

The app is optimized for deployment on Vercel. Simply connect your GitHub repository to Vercel and deploy.

## License

MIT
