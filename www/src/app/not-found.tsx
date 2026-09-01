'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadWasmModule } from '@/lib/wasm-client';

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

        (async () => {
            try {
                const wasm = await loadWasmModule();
                const response = await wasm.short_url_resolve(shortId);
                if (cancelled) return;

                const data = typeof response === 'string' ? JSON.parse(response) : response;
                if (data && typeof data.target_url === 'string' && data.target_url) {
                    setStatus('redirecting');
                    // Brief pause so the "Redirecting..." message is visible.
                    window.setTimeout(() => {
                        window.location.replace(data.target_url);
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
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        <h1 className="text-xl font-semibold text-gray-200">
                            Checking short link...
                        </h1>
                    </>
                )}

                {status === 'redirecting' && (
                    <>
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                        <h1 className="text-xl font-semibold text-gray-200">
                            Redirecting...
                        </h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Taking you to the destination URL.
                        </p>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <h1 className="text-6xl font-bold text-gray-500">404</h1>
                        <p className="mt-4 text-lg font-semibold text-gray-200">
                            Page not found
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                            The short link is invalid or has expired. If you created it in
                            another browser, it may only be available there.
                        </p>
                        {errorDetail && (
                            <p className="mt-3 break-all rounded bg-white/5 px-3 py-2 text-xs text-gray-500">
                                {errorDetail}
                            </p>
                        )}
                        <Link
                            href="/"
                            className="mt-6 inline-block rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Go to Home
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}
