import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getTranslations } from 'next-intl/server';
import AppInitializer from "@/components/AppInitializer";
import ClientLocaleProvider from "@/components/ClientLocaleProvider";
import { defaultLocale, type Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Layout');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  // Server-side rendering can only ever be one fixed locale; normalize
  // anything unexpected back to the configured default (zh).
  const safeLocale: Locale = (['en', 'zh'] as const).includes(locale)
    ? locale
    : defaultLocale;

  return (
    <html lang={safeLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* top cyan hairline — site accent rail */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
        />
        <ClientLocaleProvider initialLocale={safeLocale}>
          <AppInitializer>
            {children}
          </AppInitializer>
        </ClientLocaleProvider>
      </body>
    </html>
  );
}
