'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import zhMessages from '../../messages/zh.json';
import enMessages from '../../messages/en.json';

// Both message catalogs are bundled so the locale can switch instantly on the
// client — required for pure static exports where there is no server round
// trip to re-render the page in another language.
const MESSAGES: Record<Locale, AbstractIntlMessages> = {
    zh: zhMessages as AbstractIntlMessages,
    en: enMessages as AbstractIntlMessages,
};

export const COOKIE_NAME = 'NEXT_LOCALE';

interface LocaleContextValue {
    locale: Locale;
    setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: defaultLocale,
    setLocale: () => {
        /* no-op until provider mounts */
    },
});

export function useClientLocale(): LocaleContextValue {
    return useContext(LocaleContext);
}

function readCookieLocale(): Locale | null {
    if (typeof document === 'undefined') return null;
    const stored = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAME}=`))
        ?.split('=')[1];
    return stored && (locales as readonly string[]).includes(stored)
        ? (stored as Locale)
        : null;
}

export default function ClientLocaleProvider({
    initialLocale,
    children,
}: {
    initialLocale: Locale;
    children: React.ReactNode;
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);

    // Static export serves a fixed (default-locale) HTML shell and the server
    // never sees cookies, so restore a persisted preference after hydration.
    useEffect(() => {
        const stored = readCookieLocale();
        if (stored && stored !== locale) {
            setLocaleState(stored);
        }
    }, [locale]);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        try {
            document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
        } catch {
            /* cookie unavailable — session-only switch */
        }
    }, []);

    const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

    return (
        <LocaleContext.Provider value={value}>
            <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
                {children}
            </NextIntlClientProvider>
        </LocaleContext.Provider>
    );
}
