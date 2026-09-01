import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from "next";
import webpack from 'webpack';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environments
const isNetlify = process.env.NETLIFY === 'true' ||
  process.env.CONTEXT === 'production' ||
  process.env.NETLIFY_LOCAL === 'true' ||
  (process.env.DEPLOY_URL && process.env.DEPLOY_URL.includes('netlify'));

const isVercel = process.env.VERCEL === 'true';
const isDev = process.env.NODE_ENV === 'development';

// Pure static export mode: build with `STATIC_EXPORT=true` to produce a
// fully static `dist/` folder (no serverless API routes, WASM runs in-browser).
const isStatic = process.env.STATIC_EXPORT === 'true';

// Static export + API mode: build with `STATIC_EXPORT_API=true` (together with
// `STATIC_EXPORT=true`) so the static pages talk to the `/api/*` endpoints —
// proxied by Nginx to a Node backend whose storage is SQLite — instead of the
// in-browser WASM / localStorage path. Leave unset to keep the original
// fully-browser behavior.
const staticApiMode = process.env.STATIC_EXPORT_API === 'true';

// Log environment info
console.log('✅ Is Netlify environment:', isNetlify);
console.log('✅ Is Vercel environment:', isVercel);
console.log('✅ Is Development environment:', isDev);
console.log('✅ Is Static export mode:', isStatic);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows importing wasm files from pkg directory
  // transpilePackages: ['subconverter-wasm'],

  // Pure static export configuration
  output: isStatic ? 'export' : undefined,
  // STATIC_DIST_DIR allows overriding the output folder (used by the build
  // script when the default `dist/` is locked by a local process).
  distDir: isStatic ? (process.env.STATIC_DIST_DIR || 'dist') : '.next',
  trailingSlash: isStatic,
  images: {
    unoptimized: true, // required for `output: 'export'`
  },

  // Using serverExternalPackages to tell Next.js to resolve the WASM module at runtime
  // This ensures proper WASM loading in server environments like Netlify
  ...(isStatic ? {} : { serverExternalPackages: ['subconverter-wasm', '../pkg'] }),

  // Webpack config to support WASM
  webpack: (config, { isServer, dev }) => {
    console.log(`⚙️ Configuring webpack (isServer: ${isServer}, dev: ${dev})`);

    // Support for WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // Configure WASM output location
    if (config.output) {
      // Ensure WASM is properly emitted to a predictable location
      config.output.webassemblyModuleFilename = isServer
        ? '../static/wasm/[modulehash].wasm'  // Server build
        : 'static/wasm/[modulehash].wasm';    // Client build
    }

    // Define environment variable to help with debugging WASM loading
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.WASM_DEBUG': JSON.stringify(true),
        'process.env.DEPLOY_ENV': JSON.stringify(
          isNetlify ? 'netlify' : (isVercel ? 'vercel' : (isStatic ? 'static' : 'standard'))
        ),
        // Static build: whether the pages should use the in-browser WASM.
        // `NEXT_PUBLIC_STATIC_EXPORT=true` -> browser WASM/localStorage;
        // `false` (STATIC_EXPORT_API mode) -> fetch `/api/*` (proxied backend).
        'process.env.NEXT_PUBLIC_STATIC_EXPORT': JSON.stringify(isStatic && !staticApiMode ? 'true' : 'false'),
        // Static build marker: static-only resources (e.g. local Monaco) that
        // apply regardless of the data channel (browser WASM or proxied API).
        'process.env.NEXT_PUBLIC_IS_STATIC': JSON.stringify(isStatic ? 'true' : 'false'),
      })
    );

    // Make sure we don't interfere with the existing loaders
    return config;
  },
  ...(isStatic ? {} : {
    async rewrites() {
      return [
        // Rewrite all API calls to the pages/api directory
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    },
  }),
  ...(isStatic ? {} : {
    outputFileTracingIncludes: {
      '/api/': ['./node_modules/subconverter-wasm/**/*'],
    },
  }),
};

export default withNextIntl(nextConfig);
