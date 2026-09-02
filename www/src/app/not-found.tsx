'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadWasmModule } from '@/lib/wasm-client';
import { IS_STATIC_EXPORT } from '@/lib/api-client';

/**
 * Extract the short link ID from `/api/s/<id>` or `/s/<id>`.
 * Static export has no server-side short-link route, so the hosting server
 * returns this 404 page for any unknown path; the client then resolves the
 * short link in-browser via WASM + the local KV store (localStorage) and
 * redirects. Returns null when the path is not a short-link path.
 */
function extractShortId(pathname: string): string | null {
    const clean = pathname.replace(/\/+$/, '');
    const match = clean.match(/\/(?:api\/s|s)\/([^/]+)$/);
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

/**
 * Pure static export has no `/api/*` routes. Rewrite any target that points at
 * the current site's `/api/...` to the static `/convert` page, which runs the
 * conversion in-browser (WASM) and shows / lets you download the result.
 * Targets on other origins (remote endpoints) are left untouched.
 */
function rewriteForStaticExport(url: string): string {
    let target: URL;
    try {
        target = new URL(url, window.location.href);
    } catch {
        return url;
    }
    if (target.origin !== window.location.origin) return url;
    if (!target.pathname.startsWith('/api/')) return url;
    // Keep the trailing slash form used by the static export build.
    target.pathname = '/convert/';
    return target.href;
}

type Status = 'checking' | 'redirecting' | 'invalid';

export default function NotFound() {
    const [status, setStatus] = useState<Status>('checking');
    const [errorDetail, setErrorDetail] = useState('');

    useEffect(() => {
        let cancelled = false;
        const shortId = extractShortId(window.location.pathname);

        if (!shortId) {
            setStatus('invalid');
            return;
        }

        // Non-browser-data mode (server-backed build): let the server decide.
        // /api/s/<id> 302s to the resolved endpoint (Nginx proxy in static-API
        // mode, or the real Route Handler in the full build).
        if (!IS_STATIC_EXPORT) {
            window.location.replace('/api/s/' + encodeURIComponent(shortId));
            return;
        }

        (async () => {
            try {
                const wasm = await loadWasmModule();
                // Pass the current origin so links with an empty endpoint base_url
                // resolve to this site.
                const response = await wasm.short_url_resolve(shortId, window.location.href);
                if (cancelled) return;

                const data = typeof response === 'string' ? JSON.parse(response) : response;
                if (data && typeof data.target_url === 'string' && data.target_url) {
                    setStatus('redirecting');
                    // Brief pause so the "Redirecting..." message is visible.
                    window.setTimeout(() => {
                        window.location.replace(rewriteForStaticExport(data.target_url));
                    }, 300);
                } else {
                    setStatus('invalid');
                }
            } catch (e: any) {
                if (cancelled) return;
                setStatus('invalid');
                setErrorDetail(typeof e === 'string' ? e : e?.message || '');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                {status === 'checking' && (
                    <>
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent shadow-[0_0_18px_rgba(34,211,238,0.35)]" />
                        <p className="term-cursor justify-center font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/90">
                            resolving link
                        </p>
                        <h1 className="mt-4 text-xl font-semibold text-gray-200">
                            Checking short link...
                        </h1>
                    </>
                )}

                {status === 'redirecting' && (
                    <>
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent shadow-[0_0_18px_rgba(52,211,153,0.35)]" />
                        <p className="term-cursor justify-center font-mono text-xs uppercase tracking-[0.3em] text-emerald-300/90">
                            link found
                        </p>
                        <h1 className="mt-4 text-xl font-semibold text-gray-200">
                            Redirecting...
                        </h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Taking you to the destination URL.
                        </p>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <p className="font-mono text-7xl font-extrabold leading-none tracking-tight text-transparent">
                            <span className="neon-text bg-gradient-to-r from-cyan-300 to-sky-500 bg-clip-text">404</span>
                        </p>
                        <div className="divider-line mx-auto mt-6 w-24" />
                        <p className="mt-4 text-lg font-semibold text-gray-200">
                            Page not found
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                            The short link is invalid or has expired. If you created it in
                            another browser, it may only be available there.
                        </p>
                        {errorDetail && (
                            <p className="mt-3 break-all rounded border border-white/10 bg-[#060e1c]/80 px-3 py-2 font-mono text-xs text-gray-400">
                                {errorDetail}
                            </p>
                        )}
                        <Link
                            href="/"
                            className="btn-glow mt-7 inline-block rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-sky-500"
                        >
                            Go to Home
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}
