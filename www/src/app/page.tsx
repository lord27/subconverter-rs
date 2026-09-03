"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, FormEvent, useCallback, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { convertSubscription, SubResponseData, ErrorData, createShortUrl, ShortUrlData, getAvailableDownloads, detectUserOS, AppDownloadInfo } from '@/lib/api-client';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ExternalConfigSelect from '@/components/ExternalConfigSelect';
import { copyToClipboard } from '@/lib/clipboard';

export default function Home() {
  const t = useTranslations('HomePage');

  const [subscriptionUrl, setSubscriptionUrl] = useState("");
  const [targetFormat, setTargetFormat] = useState("clash");
  const [configUrl, setConfigUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SubResponseData | null>(null);
  const [error, setError] = useState<ErrorData | null>(null);
  const [saveApiUrl, setSaveApiUrl] = useState(true);
  const [shortUrlCreating, setShortUrlCreating] = useState(false);
  const [shortUrlCreated, setShortUrlCreated] = useState(false);
  const [shortUrlData, setShortUrlData] = useState<ShortUrlData | null>(null);
  const [userOs, setUserOs] = useState<string>("");
  const [downloads, setDownloads] = useState<AppDownloadInfo[]>([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Detect user OS
  useEffect(() => {
    setUserOs(detectUserOS());
  }, []);

  // Fetch available downloads
  useEffect(() => {
    async function fetchDownloads() {
      try {
        setDownloadLoading(true);
        const downloadList = await getAvailableDownloads();
        setDownloads(downloadList);
      } catch (err) {
        console.error("Error fetching downloads:", err);
      } finally {
        setDownloadLoading(false);
      }
    }

    fetchDownloads();
  }, []);

  // Reset shortUrlCreated when form inputs change
  useEffect(() => {
    setShortUrlCreated(false);
  }, [subscriptionUrl, targetFormat, configUrl]);

  // Generate the API URL based on form inputs
  const generateApiUrl = useCallback(() => {
    const baseUrl = window.location.origin + '/api/sub';
    const params = new URLSearchParams();
    params.append('target', targetFormat);
    params.append('url', subscriptionUrl);

    // Add config if set
    if (configUrl) {
      params.append('config', configUrl);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [targetFormat, subscriptionUrl, configUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subscriptionUrl) return;

    setIsLoading(true);
    setResult(null);
    setError(null);
    setShortUrlCreated(false);

    try {
      // Call the actual conversion API
      const payload: any = {
        target: targetFormat,
        url: subscriptionUrl
      };

      // Add config if set
      if (configUrl) {
        payload.config = configUrl;
      }

      const responseData = await convertSubscription(payload);
      setResult(responseData);

      // If saveApiUrl is enabled, create a short URL
      if (saveApiUrl) {
        await createShortUrlForConversion();
      }
    } catch (err) {
      console.error("Conversion API call failed:", err);
      setError(err as ErrorData || {
        error: t('connectFailed'),
        details: String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a short URL for the current subscription
  const createShortUrlForConversion = async () => {
    if (!subscriptionUrl) return;

    try {
      setShortUrlCreating(true);
      const apiUrl = generateApiUrl();
      const description = `${targetFormat.toUpperCase()} subscription for ${subscriptionUrl.substring(0, 30)}${subscriptionUrl.length > 30 ? '...' : ''}`;

      const shortUrl = await createShortUrl({
        target_url: apiUrl,
        description: description
      });

      setShortUrlData(shortUrl);
      setShortUrlCreated(true);
    } catch (err) {
      console.error("Error creating short URL:", err);
      // We don't show this error to the user to avoid confusion
      // The main conversion still succeeded
    } finally {
      setShortUrlCreating(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!result || !result.content) return;

    const blob = new Blob([result.content], { type: result.content_type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config.${targetFormat === 'clash' ? 'yaml' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result, targetFormat]);

  // The supported target formats from the convert page
  const SUPPORTED_TARGETS = [
    'clash', 'singbox', 'surge', 'quan', 'quanx',
    'mellow', 'surfboard', 'loon', 'ss', 'ssr', 'sssub',
    'v2ray', 'trojan', 'trojan-go', 'hysteria', 'hysteria2',
    'ssd', 'mixed', 'clashr'
  ];

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0a1526]/85 px-4 py-2.5 text-sm text-gray-100 " +
    "placeholder:text-gray-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20";

  return (
    <main className="relative flex min-h-screen flex-col items-center px-4 pb-20 pt-10 md:px-8">
      <div className="z-10 w-full max-w-6xl">
        {/* ======================= masthead ======================= */}
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_26px_-6px_rgba(34,211,238,0.65)]">
              <Image
                src="/logo.svg"
                alt="Subconverter Logo"
                width={30}
                height={30}
                className="drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/90">
                subconverter
              </p>
              <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500">
                rust · wasm · v0.2
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <a
              href="https://github.com/lonelam/subconverter-rs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10"
            >
              <svg className="h-4 w-4 text-gray-300 transition-colors group-hover:text-cyan-200" height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              <span className="font-medium text-gray-200 group-hover:text-white">{t('githubStar')}</span>
              <span className="hidden text-xs text-gray-500 transition-colors sm:inline group-hover:text-cyan-200/80">
                {t('selfHostPrompt')}
              </span>
            </a>
          </div>
        </header>

        {/* ======================= hero ======================= */}
        <section className="mt-12 max-w-3xl">
          <p className="term-cursor font-mono text-xs tracking-[0.22em] text-cyan-300/90">
            subscription · convert · proxy rules
          </p>
          <h1 className="neon-text mt-6 bg-gradient-to-r from-cyan-200 via-sky-100 to-slate-200 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 font-mono text-sm text-gray-500">
            $ subconverter --input your_subscription --output {targetFormat} ✓
          </p>
        </section>

        {/* ======================= quick convert ======================= */}
        <section className="panel mt-12 rounded-2xl p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-cyan-300/90">
              &lt; quick_convert /&gt;
            </h3>
            <span className="status-dot font-mono text-xs text-emerald-300/90">
              wasm ready
            </span>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="subscriptionUrl" className="mb-1.5 block text-sm font-medium text-gray-300">
                {t('subscriptionUrl')}
              </label>
              <input
                type="url"
                id="subscriptionUrl"
                placeholder="https://example.com/subscription"
                className={inputClass}
                value={subscriptionUrl}
                onChange={(e) => setSubscriptionUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="targetFormat" className="mb-1.5 block text-sm font-medium text-gray-300">
                  {t('targetFormat')}
                </label>
                <select
                  id="targetFormat"
                  className={inputClass}
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                >
                  {SUPPORTED_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="configUrl" className="mb-1.5 block text-sm font-medium text-gray-300">
                  {t('externalConfig')}
                </label>
                <ExternalConfigSelect
                  id="configUrl"
                  value={configUrl}
                  onChange={setConfigUrl}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  id="saveApiUrl"
                  type="checkbox"
                  checked={saveApiUrl}
                  onChange={(e) => setSaveApiUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#0a1526] accent-cyan-400 focus:ring-cyan-400/30"
                />
                {t('saveAsSubscription')}
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-glow ml-auto w-full bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3 font-bold text-[#02151d] transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isLoading ? t('converting') : t('convert')}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-xl border border-red-400/40 bg-red-500/10 p-4">
              <h4 className="text-lg font-semibold text-red-300">{t('error')}</h4>
              <p className="text-red-200/90">{error.error}</p>
              {error.details && <p className="mt-1 text-sm text-red-300/80">{error.details}</p>}
              <p className="mt-2 text-sm text-gray-400">
                {t('reportIssuePrompt')}
                {' '}
                <a
                  href="https://github.com/lonelam/subconverter-rs/issues/new/choose"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline-offset-2 hover:underline"
                >
                  {t('createIssueLinkText')}
                </a>
                . {t('pasteErrorInfo')}
              </p>
            </div>
          )}

          {result && !error && (
            <div className="mt-6 space-y-4">
              {/* API URL Display */}
              <div className="rounded-xl border border-white/10 bg-[#060e1c]/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-gray-200">{t('subscriptionUrlDisplay')}</h4>
                  <button
                    onClick={() => copyToClipboard(shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl())}
                    className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    {t('copy')}
                  </button>
                </div>
                <p className="break-all rounded-lg bg-[#04090f] p-2.5 font-mono text-xs text-cyan-100/90">
                  {shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl()}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {t('useUrlMessage')}
                  {saveApiUrl && !shortUrlCreated && t('urlWillBeSaved')}
                  {shortUrlCreated && t('shortUrlMessage')}
                </p>
              </div>

              {/* Result preview */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-gray-200">{t('previewTitle')}</h4>
                  <div className="font-mono text-xs text-gray-500">Content-Type: {result.content_type}</div>
                </div>
                <textarea
                  readOnly
                  value={result.content}
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-[#04090f] p-3 font-mono text-sm text-gray-200 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleDownload}
                    className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-[#02241b] transition hover:bg-emerald-400"
                  >
                    {t('downloadConfig')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ======================= feature grid ======================= */}
        <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Advanced convert */}
          <div className="panel panel-interactive rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-400/80">01 / advanced</span>
              <svg className="h-5 w-5 text-cyan-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{t('advancedConvert')}</h3>
            <p className="mb-5 mt-2 text-sm leading-relaxed text-gray-400">{t('advancedDescription')}</p>
            <Link
              href="/convert"
              className="block rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-center font-semibold text-white transition hover:from-cyan-500 hover:to-sky-500"
            >
              {t('advancedOptions')}
            </Link>
          </div>

          {/* My saved links */}
          <div className={`panel panel-interactive rounded-2xl p-6 ${result && (saveApiUrl || shortUrlCreated) ? 'border-emerald-400/50' : ''}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-400/80">02 / links</span>
              <svg className="h-5 w-5 text-cyan-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{t('mySavedLinks')}</h3>
            <p className="mb-5 mt-2 text-sm leading-relaxed text-gray-400">
              {t('savedLinksDescription')}
              {shortUrlCreating && (
                <span className="mt-2 block text-sm text-cyan-300">{t('creatingShortUrl')}</span>
              )}
              {shortUrlCreated && (
                <span className="mt-2 block text-sm text-emerald-300">{t('shortUrlCreated')}</span>
              )}
            </p>
            <Link
              href="/links"
              className={`block rounded-lg px-4 py-2.5 text-center font-semibold transition ${
                result && (saveApiUrl || shortUrlCreated)
                  ? 'bg-emerald-500 text-[#02241b] hover:bg-emerald-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {t('manageLinks')}
            </Link>
          </div>

          {/* Server settings */}
          <div className="panel panel-interactive rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-400/80">03 / server</span>
              <svg className="h-5 w-5 text-cyan-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{t('serverSettings')}</h3>
            <p className="mb-5 mt-2 text-sm leading-relaxed text-gray-400">{t('serverSettingsDescription')}</p>
            <Link
              href="/settings"
              className="block rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:from-sky-500 hover:to-blue-500"
            >
              {t('manageSettings')}
            </Link>
          </div>

          {/* App downloads */}
          <div className="panel panel-interactive rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-400/80">04 / clients</span>
              <svg className="h-5 w-5 text-cyan-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{t('appDownloads')}</h3>
            <p className="mb-5 mt-2 text-sm leading-relaxed text-gray-400">{t('appDownloadsDescription')}</p>
            <div className="flex gap-3">
              {userOs !== "unknown" && (
                downloadLoading ? (
                  <div className="flex-1 py-3 text-center text-sm text-gray-500">{t('loadingDownloads')}</div>
                ) : (
                  downloads.find(d => d.platform === userOs) ? (
                    <a
                      href={downloads.find(d => d.platform === userOs)?.download_url}
                      className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('downloadFor', { os: userOs.charAt(0).toUpperCase() + userOs.slice(1) })}
                    </a>
                  ) : (
                    <div className="flex-1 py-3 text-center text-sm text-gray-500">{t('noDownloadAvailable', { os: userOs })}</div>
                  )
                )
              )}
              <Link
                href="/downloads"
                className="flex-1 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:from-sky-500 hover:to-blue-500"
              >
                {t('allDownloads')}
              </Link>
            </div>
          </div>
        </section>

        {/* ======================= status rail ======================= */}
        <footer className="mt-14">
          <div className="panel flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3.5 font-mono text-xs text-gray-400">
            <span className="status-dot text-emerald-300/90">uplink stable</span>
            <span className="hidden text-gray-500 sm:inline">wasm://runtime · kv:local · tls13 ✓</span>
            <span>{t('footer')}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
