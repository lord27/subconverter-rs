'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateRules, RulesUpdateResult } from '@/lib/api-client';

export default function RulesAdmin() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RulesUpdateResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpdateRules = async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            const data = await updateRules();
            setResult(data);
        } catch (err) {
            console.error("Rules update failed:", err);
            setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const badgeClass = (kind: string) => {
        if (kind === 'success') return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30';
        if (kind === 'partial') return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
        return 'bg-red-400/15 text-red-300 border-red-400/30';
    };

    return (
        <div className="container mx-auto max-w-4xl p-4">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="neon-text text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-sky-100">
                    Rules Management
                </h1>
                <Link
                    href="/"
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                    ← Back to Home
                </Link>
            </div>

            <div className="panel rounded-xl p-6">
                <h2 className="mb-1 font-mono text-xs uppercase tracking-[0.24em] text-cyan-300/90">
                    &lt; update_rules /&gt;
                </h2>
                <p className="mb-5 mt-3 text-sm text-gray-400">
                    Update rules files from configured repositories. This process may take a few minutes.
                </p>

                <button
                    onClick={handleUpdateRules}
                    disabled={isLoading}
                    className="btn-glow rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? 'Updating...' : 'Update Rules'}
                </button>
            </div>

            {error && (
                <div className="mt-6 rounded-xl border border-red-400/50 bg-red-500/10 p-4 text-red-200/90">
                    <h3 className="mb-1 font-semibold text-red-300">Error</h3>
                    <p className="font-mono text-xs">{error}</p>
                </div>
            )}

            {result && (
                <div className="panel mt-6 rounded-xl p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-100">Result</h3>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(result.success ? 'success' : 'partial')}`}>
                            {result.success ? 'Success' : 'Partial Success/Failure'}
                        </span>
                    </div>
                    {result.message && <p className="mb-4 text-sm text-gray-300">{result.message}</p>}

                    <div className="divider-line pt-4">
                        <h4 className="mb-2 font-medium text-gray-200">Repository Details</h4>
                        <div className="space-y-4">
                            {result.details && Object.entries(result.details).map(([repo, details]: [string, any]) => (
                                <div key={repo} className="rounded-lg border border-white/10 bg-[#060e1c]/60 p-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <h5 className="truncate font-mono text-sm text-cyan-200/90">{repo}</h5>
                                        <span className={`inline-block shrink-0 rounded-full border px-2 py-0.5 font-mono text-xs ${badgeClass(details.status === 'success' ? 'success' : details.status === 'partial' ? 'partial' : 'error')}`}>
                                            {details.status}
                                        </span>
                                    </div>

                                    {details.files_updated.length > 0 && (
                                        <div className="mb-2">
                                            <h6 className="text-xs font-medium text-gray-300">Files Updated ({details.files_updated.length})</h6>
                                            <ul className="mt-1 max-h-32 overflow-y-auto pl-4 text-xs text-gray-400">
                                                {details.files_updated.slice(0, 10).map((file: string) => (
                                                    <li key={file} className="truncate">{file}</li>
                                                ))}
                                                {details.files_updated.length > 10 && (
                                                    <li className="text-gray-500">...and {details.files_updated.length - 10} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {details.errors.length > 0 && (
                                        <div>
                                            <h6 className="text-xs font-medium text-red-300">Errors ({details.errors.length})</h6>
                                            <ul className="mt-1 max-h-32 overflow-y-auto pl-4 text-xs text-red-300/80">
                                                {details.errors.slice(0, 5).map((error: string, i: number) => (
                                                    <li key={i} className="truncate">{error}</li>
                                                ))}
                                                {details.errors.length > 5 && (
                                                    <li className="text-gray-500">...and {details.errors.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
