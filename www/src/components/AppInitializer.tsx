'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Path for the startup page
const STARTUP_PATH = '/startup';
// Key for localStorage flag
const INIT_FLAG_KEY = 'webappInitialized';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isInitialized, setIsInitialized] = useState<boolean | null>(null); // null initially, true/false after check

    // Static export uses `trailingSlash: true`, so the actual URL path is
    // `/startup/` while STARTUP_PATH is `/startup`. Normalize before comparing
    // to avoid an infinite redirect loop that leaves the page blank.
    const isStartupPath = pathname.replace(/\/+$/, '') === STARTUP_PATH;

    useEffect(() => {
        // Check localStorage only on the client side
        const initialized = localStorage.getItem(INIT_FLAG_KEY) === 'true';
        setIsInitialized(initialized);

        console.log(`AppInitializer: Initialized flag = ${initialized}`);

        // If not initialized and not already on the startup page, redirect
        if (!initialized && !isStartupPath) {
            console.log(`AppInitializer: Redirecting to ${STARTUP_PATH}`);
            router.replace(STARTUP_PATH);
        } else if (initialized && isStartupPath) {
            // If somehow initialized but still on startup, redirect home
            console.log(`AppInitializer: Already initialized, redirecting from ${STARTUP_PATH} to /`);
            router.replace('/');
        }
    }, [pathname, isStartupPath, router]);

    // Don't render children until the initialization check is complete and successful,
    // or if we are already on the startup page (let it handle its own rendering)
    if (isInitialized === null || (!isInitialized && !isStartupPath) || (isInitialized && isStartupPath)) {
        // Render minimal content or a loading indicator while checking/redirecting
        // Returning null prevents rendering children during the redirect flicker
        return null;
    }

    // Render children only if initialized and not on the startup page
    return <>{children}</>;
} 