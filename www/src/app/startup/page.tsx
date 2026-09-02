'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeWebApp } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

export default function StartupPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations('Startup');

    useEffect(() => {
        const performInitialization = async () => {
            try {
                setStatus(t('status_initializing'));
                console.log('Attempting webapp initialization...');
                const result = await initializeWebApp();
                console.log('Initialization API result:', result);

                if (result.success) {
                    setStatus(t('status_success'));
                    // Set a flag in localStorage to indicate initialization is complete
                    localStorage.setItem('webappInitialized', 'true');
                    console.log('Initialization successful, redirecting to home...');
                    // Redirect to the home page after a short delay
                    // Adjust delay based on whether GitHub load was triggered
                    const redirectDelay = result.githubLoadTriggered ? 0 : 1000;
                    setTimeout(() => router.push('/'), redirectDelay);
                } else {
                    console.error('Initialization failed:', result.message);
                    setError(result.message || t('error_unknown'));
                    setStatus(t('status_failed'));
                }
            } catch (err: any) {
                console.error('Error during initialization:', err);
                setError(err.message || t('error_exception'));
                setStatus(t('status_failed'));
            }
        };

        performInitialization();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]); // Removed t from dependencies as it might cause loops if translations change

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="panel w-full max-w-md rounded-2xl p-8 text-center">
                <p className="term-cursor justify-center font-mono text-xs uppercase tracking-[0.28em] text-cyan-300/90">
                    subconverter · bootstrap
                </p>
                <h1 className="mt-6 text-2xl font-bold text-gray-100">{t('title')}</h1>
                <p className="mt-3 text-sm text-gray-400">{t('description')}</p>
                <div className="mt-6">
                    <p className="font-mono text-sm text-gray-200">{status}</p>
                    {error && (
                        <p className="mt-2 font-mono text-sm text-red-300">
                            <span className="text-red-400">!</span> {error}
                        </p>
                    )}
                </div>
                {status === t('status_initializing') && (
                    <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent shadow-[0_0_18px_rgba(34,211,238,0.35)]"></div>
                )}
            </div>
        </div>
    );
}

// Add basic translations for this page - these should ideally be in your translation files
// For example, in messages/en.json:
/*
{
  "Startup": {
    "title": "Initializing Subconverter",
    "description": "Please wait while we set things up for the first time. This might take a moment...",
    "status_initializing": "Initializing...",
    "status_success": "Initialization Complete! Redirecting...",
    "status_failed": "Initialization Failed",
    "error_unknown": "An unknown error occurred during initialization.",
    "error_exception": "An exception occurred during initialization."
  }
}
*/ 