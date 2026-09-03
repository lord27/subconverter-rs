'use client';

import React, { useState, useCallback, ChangeEvent, FormEvent, useEffect, useRef, useId } from 'react';
import { useTranslations } from 'next-intl';
import { copyToClipboard } from '@/lib/clipboard';
import ExternalConfigSelect from '@/components/ExternalConfigSelect';
import {
    convertSubscription,
    SubconverterFormParams,
    SubResponseData,
    ErrorData,
    createShortUrl,
    ShortUrlData,
    IS_STATIC_EXPORT
} from '@/lib/api-client';

// Define supported targets
const SUPPORTED_TARGETS = [
    'auto', 'clash', 'clashr', 'surge', 'quan', 'quanx',
    'mellow', 'surfboard', 'loon', 'ss', 'ssr', 'sssub',
    'v2ray', 'trojan', 'trojan-go', 'hysteria', 'hysteria2',
    'ssd', 'mixed', 'singbox'
];

type SectionAccent = 'cyan' | 'sky' | 'emerald' | 'teal' | 'amber' | 'rose';

const ACCENT_META: Record<SectionAccent, { dot: string; label: string }> = {
    cyan:    { dot: 'bg-cyan-400',    label: 'text-cyan-300' },
    sky:     { dot: 'bg-sky-400',     label: 'text-sky-300' },
    emerald: { dot: 'bg-emerald-400', label: 'text-emerald-300' },
    teal:    { dot: 'bg-teal-400',    label: 'text-teal-300' },
    amber:   { dot: 'bg-amber-400',   label: 'text-amber-300' },
    rose:    { dot: 'bg-rose-400',    label: 'text-rose-300' },
};

// Fields belonging to each collapsible section — used to render the
// "N configured" badge per section header.
const SECTION_FIELDS: Record<string, string[]> = {
    required: ['target', 'flavor', 'url'],
    config: ['config'],
    filter: ['include', 'exclude', 'rename', 'emoji', 'add_emoji', 'remove_emoji', 'fdn'],
    output: ['ver', 'new_name', 'script', 'classic', 'append_type', 'list', 'sort', 'rename_node', 'expand'],
    protocol: ['tfo', 'udp', 'scv', 'tls13'],
    advanced: ['group', 'groups', 'ruleset', 'insert', 'prepend', 'interval', 'strict', 'sort_script', 'filter', 'dev_id', 'token', 'upload', 'upload_path'],
};

function countSetFields(fields: string[], set: ReadonlySet<string>): number {
    let n = 0;
    for (const f of fields) if (set.has(f)) n += 1;
    return n;
}

/** Tiny pill showing how many fields of a section are configured. */
function FieldCountBadge({ n }: { n: number }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold leading-none text-emerald-300">
            <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            {n}
        </span>
    );
}

interface CollapsibleFieldsetProps {
    title: React.ReactNode;
    children: React.ReactNode;
    /** 分组序号（01/02/…） */
    index?: string;
    /** 状态徽标（已配置字段计数等） */
    badge?: React.ReactNode;
    /** 分组强调色：圆点 + 展开时的标题色 */
    accent?: SectionAccent;
    /** 追加到卡片容器上的 class */
    className?: string;
    /** 初始是否展开 */
    defaultOpen?: boolean;
}

/** A form section whose header row toggles its body open / closed. */
function CollapsibleFieldset({
    title,
    children,
    index,
    badge,
    accent = 'cyan',
    className = '',
    defaultOpen = true,
}: CollapsibleFieldsetProps) {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();
    const meta = ACCENT_META[accent];

    return (
        <section
            className={`overflow-hidden rounded-xl border border-white/10 bg-[#081120]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_40px_-28px_rgba(6,182,212,0.45)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200 ${className}`}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={contentId}
                className="group flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none sm:px-5"
            >
                {index && (
                    <span className="hidden shrink-0 font-mono text-[11px] font-medium tracking-[0.18em] text-slate-500 transition-colors group-hover:text-slate-300 sm:inline-block">
                        {index}
                    </span>
                )}
                <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot} transition-all duration-300 ${open ? 'opacity-100' : 'opacity-35 group-hover:opacity-90'}`}
                />
                <span
                    className={`flex-1 text-[15px] font-semibold tracking-wide text-slate-100 transition-colors duration-200 ${open ? meta.label : ''}`}
                >
                    {title}
                </span>
                {badge}
                <svg
                    aria-hidden
                    className={`h-4 w-4 shrink-0 transition-all duration-300 ${open ? 'rotate-180 text-cyan-300' : 'rotate-0 text-slate-500 group-hover:text-cyan-300'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            <div
                id={contentId}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="mx-5 border-t border-white/[0.07]" />
                    <div className="px-4 pb-5 pt-4 sm:px-5">{children}</div>
                </div>
            </div>
        </section>
    );
}

export default function ConvertPage() {
    const [formData, setFormData] = useState<SubconverterFormParams>({
        target: 'clash',
        url: '',
    });

    // Track which fields have been explicitly set by the user
    const [setFields, setSetFields] = useState<Set<string>>(new Set(['target', 'url']));

    // Guards the automatic conversion triggered from a short-link landing
    // (`/convert?target=...&url=...`) against double runs (StrictMode).
    const autoConverted = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SubResponseData | null>(null);
    const [error, setError] = useState<ErrorData | null>(null);
    const [saveApiUrl, setSaveApiUrl] = useState(false);
    const [shortUrlCreating, setShortUrlCreating] = useState(false);
    const [shortUrlCreated, setShortUrlCreated] = useState(false);
    const [shortUrlData, setShortUrlData] = useState<ShortUrlData | null>(null);

    const t = useTranslations('ConvertPage');
    const commonT = useTranslations('Common');

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const propertyName = name as keyof SubconverterFormParams;

        setFormData(prev => {
            const newFormData = { ...prev };

            // Update the form field value
            if (type === 'checkbox') {
                (newFormData[propertyName] as any) = (e.target as HTMLInputElement).checked;
            } else if (type === 'number') {
                const numValue = value === '' ? undefined : parseInt(value, 10);
                (newFormData[propertyName] as any) = numValue;
            } else {
                // For text fields, empty string is a valid value
                (newFormData[propertyName] as any) = value;
            }

            // Special handling for target changes
            if (name === 'target' && (!setFields.has('filename') ||
                ['config.yaml', 'config.json', 'profile.conf'].includes(prev.filename || ''))) {
                const newTarget = value;
                let defaultFilename = 'config.txt';
                if (newTarget.startsWith('clash') || newTarget === 'singbox') {
                    defaultFilename = 'config.yaml';
                } else if (newTarget === 'sssub' || newTarget === 'ssd') {
                    defaultFilename = 'config.json';
                } else if (['surge', 'quan', 'quanx', 'loon', 'surfboard', 'mellow'].includes(newTarget)) {
                    defaultFilename = 'profile.conf';
                }
                newFormData.filename = defaultFilename;
            }

            // Handle emoji flags
            if (name === 'emoji') {
                const checked = (e.target as HTMLInputElement).checked;
                newFormData.emoji = checked;
                if (checked) {
                    // When enabling combined emoji, implicitly set these too
                    newFormData.add_emoji = true;
                    newFormData.remove_emoji = true;
                    // Update set fields
                    setSetFields(prev => new Set([...prev, 'emoji', 'add_emoji', 'remove_emoji']));
                    return newFormData;
                }
            } else if (name === 'add_emoji' || name === 'remove_emoji') {
                // If a specific flag is changed, uncheck the combined 'emoji' flag
                newFormData.emoji = false;
                setSetFields(prev => new Set([...prev, 'emoji', name]));
                return newFormData;
            }

            // Mark this field as set
            setSetFields(prev => new Set([...prev, name]));
            return newFormData;
        });
    }, [setFields]);

    // Reset shortUrlCreated when form inputs change
    useEffect(() => {
        setShortUrlCreated(false);
        setShortUrlData(null); // Also reset the data
    }, [formData]);

    const handleResetField = useCallback((fieldName: string) => {
        setFormData(prev => {
            const newFormData = { ...prev };
            // Delete the property to truly unset it
            delete (newFormData as any)[fieldName];
            return newFormData;
        });

        setSetFields(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldName);
            return newSet;
        });
    }, []);

    // External config picked from the bundled-INI dropdown (or a custom URL).
    const handleConfigChange = useCallback((value: string) => {
        if (value === '') {
            handleResetField('config');
            return;
        }
        setFormData(prev => ({ ...prev, config: value }));
        setSetFields(prev => new Set([...prev, 'config']));
    }, [handleResetField]);

    // Fields that map to `?flag=1` in the conversion query string.
    const BOOL_FIELDS = new Set([
        'new_name', 'script', 'classic', 'append_type', 'emoji', 'add_emoji',
        'remove_emoji', 'list', 'sort', 'fdn', 'tfo', 'udp', 'scv', 'tls13',
        'rename_node', 'expand', 'insert', 'prepend', 'strict', 'upload',
    ]);
    // Numeric query fields.
    const NUM_FIELDS = new Set(['ver', 'interval']);

    // Default download filename for a given target (mirrors handleInputChange).
    const defaultFilenameForTarget = (target: string): string => {
        if (target.startsWith('clash') || target === 'singbox') return 'config.yaml';
        if (target === 'sssub' || target === 'ssd') return 'config.json';
        if (['surge', 'quan', 'quanx', 'loon', 'surfboard', 'mellow'].includes(target)) return 'profile.conf';
        return 'config.txt';
    };

    // Short-link landing: `/convert?target=clash&url=...` (used by permanent
    // short links in pure static export, where `/api/*` routes don't exist).
    // Populate the form from the query string and run the conversion once.
    useEffect(() => {
        if (autoConverted.current || typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (!params.get('url')) return;
        autoConverted.current = true;

        const initial: SubconverterFormParams = { target: 'clash', url: '' };
        const fields = new Set<string>(['target', 'url']);

        for (const [key, value] of params.entries()) {
            if (value === '') continue;
            if (BOOL_FIELDS.has(key)) {
                (initial as any)[key] = value === '1' || value.toLowerCase() === 'true';
            } else if (NUM_FIELDS.has(key)) {
                const num = parseInt(value, 10);
                if (!Number.isNaN(num)) (initial as any)[key] = num;
            } else {
                (initial as any)[key] = value;
            }
            fields.add(key);
        }

        // Ensure a sensible download filename even when the link omits it.
        if (!initial.filename) {
            initial.filename = defaultFilenameForTarget(initial.target || 'clash');
            fields.add('filename');
        }

        setFormData(initial);
        setSetFields(fields);

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const responseData = await convertSubscription(initial);
                setResult(responseData);
                // A landing link that carries a `filename` is meant to deliver
                // a file (e.g. permanent short links / direct download links):
                // trigger the download right away instead of only rendering the
                // result on screen.
                if (initial.filename && responseData.content) {
                    const blob = new Blob([responseData.content], { type: responseData.content_type || 'text/plain' });
                    const downloadUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = initial.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(downloadUrl);
                }
            } catch (err) {
                console.error("Conversion API call failed:", err);
                setError(err as ErrorData || {
                    error: commonT('connectFailed'),
                    details: String(err)
                });
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError(null);
        setShortUrlCreated(false); // Reset short URL status on new submit
        setShortUrlData(null);

        try {
            const responseData = await convertSubscription(formData);
            setResult(responseData);

            // If saveApiUrl is enabled, create a short URL
            if (saveApiUrl) {
                await createShortUrlForConversion();
            }

        } catch (err) {
            console.error("Conversion API call failed:", err);
            setError(err as ErrorData || {
                error: 'Failed to connect to the conversion API.',
                details: String(err)
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, saveApiUrl]);

    const handleDownload = useCallback(() => {
        if (!result || !result.content) return;

        const blob = new Blob([result.content], { type: result.content_type || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = formData.filename || 'config'; // Use filename from form or default
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [result, formData.filename]);

    const isSubmitDisabled = !formData.target || !formData.url || isLoading;

    // Derived stats for the header console strip.
    const urlCount = formData.url ? formData.url.split(/[|\n]/).filter((s) => s.trim().length > 0).length : 0;
    const configuredFieldCount = setFields.size;
    const statusMeta = isLoading
        ? { label: 'Busy', text: 'text-amber-300', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]' }
        : !formData.target || !formData.url
          ? { label: 'Input', text: 'text-amber-300', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]' }
          : { label: 'Ready', text: 'text-emerald-300', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' };

    // Basic styling using Tailwind (assuming setup)
    const inputClass = "mt-1 block w-full rounded-lg border bg-[#0a1526]/85 px-3 py-2 text-sm text-gray-100 shadow-inner placeholder:text-slate-500 transition-colors focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 sm:text-sm";
    const checkboxClass = "h-4 w-4 rounded border-white/20 bg-[#0a1526] accent-cyan-400 text-cyan-400 focus:ring-cyan-400/30";
    const labelClass = "block text-sm font-medium text-slate-300";
    const buttonClass = "btn-glow inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-cyan-500 hover:to-sky-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

    // Add a helper component for field labels with reset button
    const FieldLabel = ({ htmlFor, children, fieldName, required = false }: {
        htmlFor: string,
        children: React.ReactNode,
        fieldName: string,
        required?: boolean
    }) => {
        const isSet = setFields.has(fieldName);
        const canReset = isSet && !required;

        return (
            <div className="flex justify-between items-center">
                <label htmlFor={htmlFor} className={labelClass}>
                    {children}
                    {required && <span className="text-red-500 ml-1">*</span>}
                    {isSet && !required && (
                        <span className="ml-2 text-xs font-normal text-emerald-300">
                            ({t('fieldSet')})
                        </span>
                    )}
                </label>
                {canReset && (
                    <button
                        type="button"
                        onClick={() => handleResetField(fieldName)}
                        className="text-xs text-gray-500 hover:text-red-500"
                        title="Reset to unset"
                    >
                        {t('unset')}
                    </button>
                )}
            </div>
        );
    };

    // Update the input classes to show set vs. unset state
    const getInputClass = (fieldName: string) => {
        const baseClass = "mt-1 block w-full rounded-lg border bg-[#0a1526]/85 px-3 py-2 text-sm text-gray-100 shadow-inner placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 focus:border-cyan-400/60 sm:text-sm";
        if (setFields.has(fieldName)) {
            return `${baseClass} border-emerald-400/50 bg-emerald-400/[0.04]`;
        }
        return `${baseClass} border-white/10`;
    };

    // Generate API URL from form data
    const generateApiUrl = useCallback(() => {
        // Pure static export has no /api/* routes: point at the /convert page
        // (runs the conversion in-browser). Server-backed builds use /api/sub.
        const baseUrl = IS_STATIC_EXPORT
            ? window.location.origin + '/convert/'
            : window.location.origin + '/api/sub';
        const params = new URLSearchParams();

        // Add all set fields to the URL params
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && setFields.has(key)) {
                if (typeof value === 'boolean') {
                    // For boolean values, just include the parameter name if true
                    if (value) {
                        params.append(key, '1');
                    }
                } else {
                    params.append(key, String(value));
                }
            }
        });

        return `${baseUrl}?${params.toString()}`;
    }, [formData, setFields]);

    // Create a short URL for the current conversion parameters
    const createShortUrlForConversion = async () => {
        if (!formData.url) return;

        try {
            setShortUrlCreating(true);
            setShortUrlCreated(false); // Reset before trying
            const apiUrl = generateApiUrl();
            const description = `${formData.target.toUpperCase()} conversion for ${formData.url.substring(0, 30)}${formData.url.length > 30 ? '...' : ''}`;

            // Build the same structured params as generateApiUrl()'s query string.
            // The short link stores these instead of the full URL, so it is
            // "permanent": it always redirects to the currently enabled
            // conversion endpoint (server configuration).
            const params: Record<string, unknown> = {};
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && setFields.has(key)) {
                    if (typeof value === 'boolean') {
                        if (value) params[key] = '1';
                    } else {
                        params[key] = String(value);
                    }
                }
            });

            const shortUrl = await createShortUrl({
                target_url: apiUrl,
                params,
                description: description
            });

            setShortUrlData(shortUrl);
            setShortUrlCreated(true);
        } catch (err) {
            console.error("Error creating short URL:", err);
            // Optionally show a subtle error message for short URL failure?
            // For now, we just log it.
        } finally {
            setShortUrlCreating(false);
        }
    };

    // Replace the placeholder return statement with the actual form UI
    return (
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
            {/* header console strip */}
            <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
                <div className="min-w-[15rem]">
                    <p className="term-cursor font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-cyan-300/90">
                        Subconverter&nbsp;//&nbsp;Console
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl">
                        <span className="neon-text bg-gradient-to-r from-cyan-100 via-sky-200 to-cyan-300 bg-clip-text text-transparent">
                            {t('title')}
                        </span>
                    </h1>
                </div>

                {/* live status metrics */}
                <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-[#081120]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
                    <div className="px-4 py-3 sm:px-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Target</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-cyan-300">{formData.target || '—'}</p>
                    </div>
                    <div className="border-l border-white/[0.07] px-4 py-3 sm:px-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Sources</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-200">{urlCount > 0 ? urlCount : '—'}</p>
                    </div>
                    <div className="border-l border-white/[0.07] px-4 py-3 sm:px-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Fields</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-200">{configuredFieldCount}</p>
                    </div>
                    <div className="flex items-center border-l border-white/[0.07] px-4 sm:px-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                        <span
                            className={`ml-3 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${statusMeta.text}`}
                        >
                            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                        </span>
                    </div>
                </div>
            </header>

            <div className="divider-line mb-7 mt-7" />

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Required Section */}
                <CollapsibleFieldset
                    index="01"
                    accent="cyan"
                    badge={countSetFields(SECTION_FIELDS.required, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.required, setFields)} />
                    ) : undefined}
                    title={t('requiredSectionTitle')}
                >
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <FieldLabel htmlFor="target" fieldName="target" required>{t('targetFormatLabel')}</FieldLabel>
                            <select
                                id="target"
                                name="target"
                                value={formData.target}
                                onChange={handleInputChange}
                                required
                                className={getInputClass("target")}
                            >
                                {SUPPORTED_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        {(formData.target === 'clash' || formData.target === 'clashr') && (
                            <div>
                                <FieldLabel htmlFor="flavor" fieldName="flavor">{t('clashFlavorLabel')}</FieldLabel>
                                <select
                                    id="flavor"
                                    name="flavor"
                                    value={formData.flavor || ''}
                                    onChange={handleInputChange}
                                    className={getInputClass("flavor")}
                                >
                                    <option value="">mihomo / Clash.Meta</option>
                                    <option value="premium">Clash Premium</option>
                                    <option value="stash">Stash</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">{t('clashFlavorHelp')}</p>
                            </div>
                        )}
                        <div>
                            <FieldLabel htmlFor="url" fieldName="url" required>{t('subscriptionUrlLabel')}</FieldLabel>
                            <textarea
                                id="url"
                                name="url"
                                value={formData.url}
                                onChange={handleInputChange}
                                required
                                placeholder={t('subscriptionUrlPlaceholder')}
                                rows={3}
                                className={getInputClass("url")}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('subscriptionUrlHelp')}</p>
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Config Section */}
                <CollapsibleFieldset
                    index="02"
                    accent="sky"
                    badge={countSetFields(SECTION_FIELDS.config, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.config, setFields)} />
                    ) : undefined}
                    title={t('configSectionTitle')}
                >
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <FieldLabel htmlFor="config" fieldName="config">{t('externalConfigLabel')}</FieldLabel>
                            <div className="grid grid-cols-1 gap-2">
                                <ExternalConfigSelect
                                    id="config"
                                    value={formData.config ?? ''}
                                    onChange={handleConfigChange}
                                    className={getInputClass("config")}
                                />
                                <p className="mt-1 text-xs text-gray-400">{t('externalConfigHelp')}</p>
                            </div>
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Filtering & Renaming Section */}
                <CollapsibleFieldset
                    index="03"
                    accent="emerald"
                    defaultOpen={false}
                    badge={countSetFields(SECTION_FIELDS.filter, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.filter, setFields)} />
                    ) : undefined}
                    title={t('filterRenameSectionTitle')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <FieldLabel htmlFor="include" fieldName="include">{t('includeRemarksLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="include"
                                name="include"
                                value={formData.include ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("include")}
                                placeholder={t('includeRemarksPlaceholder')}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="exclude" fieldName="exclude">{t('excludeRemarksLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="exclude"
                                name="exclude"
                                value={formData.exclude ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("exclude")}
                                placeholder={t('excludeRemarksPlaceholder')}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="rename" fieldName="rename">{t('renameNodesLabel')}</FieldLabel>
                            <textarea
                                id="rename"
                                name="rename"
                                value={formData.rename ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("rename")}
                                rows={2}
                                placeholder={t('renameNodesPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('renameNodesHelp')}</p>
                        </div>
                        <div className="space-y-2">
                            <FieldLabel htmlFor="emoji" fieldName="emoji">{t('emojiHandlingLabel')}</FieldLabel>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <input
                                        id="emoji"
                                        name="emoji"
                                        type="checkbox"
                                        checked={formData.emoji}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                    />
                                    <label htmlFor="emoji" className="ml-2 text-sm text-slate-300">{t('emojiAddRemoveLabel')}</label>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 pl-4">
                                <div className="flex items-center">
                                    <input
                                        id="add_emoji"
                                        name="add_emoji"
                                        type="checkbox"
                                        checked={formData.add_emoji}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                        disabled={formData.emoji}
                                    />
                                    <label htmlFor="add_emoji" className="ml-2 text-sm text-slate-300">{t('emojiAddOnlyLabel')}</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="remove_emoji"
                                        name="remove_emoji"
                                        type="checkbox"
                                        checked={formData.remove_emoji}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                        disabled={formData.emoji}
                                    />
                                    <label htmlFor="remove_emoji" className="ml-2 text-sm text-slate-300">{t('emojiRemoveOnlyLabel')}</label>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 pl-4">{t('emojiHelp')}</p>
                        </div>
                        <div className="flex items-center">
                            <FieldLabel htmlFor="fdn" fieldName="fdn">{t('filterDeprecatedLabel')}</FieldLabel>
                            <input
                                id="fdn"
                                name="fdn"
                                type="checkbox"
                                checked={formData.fdn}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Output Options Section */}
                <CollapsibleFieldset
                    index="04"
                    accent="teal"
                    defaultOpen={false}
                    badge={countSetFields(SECTION_FIELDS.output, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.output, setFields)} />
                    ) : undefined}
                    title={t('outputOptionsSectionTitle')}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
                        {/* Surge Specific */}
                        {formData.target === 'surge' && (
                            <div className="col-span-1">
                                <FieldLabel htmlFor="ver" fieldName="ver">{t('surgeVersionLabel')}</FieldLabel>
                                <input
                                    type="number"
                                    id="ver"
                                    name="ver"
                                    value={formData.ver ?? ''}
                                    onChange={handleInputChange}
                                    min="2"
                                    max="4"
                                    className={getInputClass("ver")}
                                />
                            </div>
                        )}
                        {/* Clash Specific */}
                        {(formData.target === 'clash' || formData.target === 'clashr') && (
                            <>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="new_name"
                                        name="new_name"
                                        type="checkbox"
                                        checked={formData.new_name}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                    />
                                    <FieldLabel htmlFor="new_name" fieldName="new_name">{t('clashNewFieldNamesLabel')}</FieldLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="script"
                                        name="script"
                                        type="checkbox"
                                        checked={formData.script}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                    />
                                    <FieldLabel htmlFor="script" fieldName="script">{t('clashEnableScriptingLabel')}</FieldLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="classic"
                                        name="classic"
                                        type="checkbox"
                                        checked={formData.classic}
                                        onChange={handleInputChange}
                                        className={checkboxClass}
                                    />
                                    <FieldLabel htmlFor="classic" fieldName="classic">{t('clashClassicRulesetLabel')}</FieldLabel>
                                </div>
                            </>
                        )}
                        <div className="flex items-center space-x-2">
                            <input
                                id="append_type"
                                name="append_type"
                                type="checkbox"
                                checked={formData.append_type}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="append_type" fieldName="append_type">{t('appendProxyTypeLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="list"
                                name="list"
                                type="checkbox"
                                checked={formData.list}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="list" fieldName="list">{t('nodeListOnlyLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="sort"
                                name="sort"
                                type="checkbox"
                                checked={formData.sort}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="sort" fieldName="sort">{t('sortNodesLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="rename_node"
                                name="rename_node"
                                type="checkbox"
                                checked={formData.rename_node}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="rename_node" fieldName="rename_node">{t('enableRuleGeneratorRenameLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="expand"
                                name="expand"
                                type="checkbox"
                                checked={formData.expand}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="expand" fieldName="expand">{t('expandRulesetsLabel')}</FieldLabel>
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Protocol Flags Section */}
                <CollapsibleFieldset
                    index="05"
                    accent="amber"
                    defaultOpen={false}
                    badge={countSetFields(SECTION_FIELDS.protocol, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.protocol, setFields)} />
                    ) : undefined}
                    title={t('protocolFlagsSectionTitle')}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center space-x-2">
                            <input
                                id="tfo"
                                name="tfo"
                                type="checkbox"
                                checked={formData.tfo}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="tfo" fieldName="tfo">{t('tcpFastOpenLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="udp"
                                name="udp"
                                type="checkbox"
                                checked={formData.udp}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="udp" fieldName="udp">{t('udpRelayLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="scv"
                                name="scv"
                                type="checkbox"
                                checked={formData.scv}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="scv" fieldName="scv">{t('skipCertVerifyLabel')}</FieldLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="tls13"
                                name="tls13"
                                type="checkbox"
                                checked={formData.tls13}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="tls13" fieldName="tls13">{t('enableTls13Label')}</FieldLabel>
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Advanced Section */}
                <CollapsibleFieldset
                    index="06"
                    accent="rose"
                    defaultOpen={false}
                    badge={countSetFields(SECTION_FIELDS.advanced, setFields) > 0 ? (
                        <FieldCountBadge n={countSetFields(SECTION_FIELDS.advanced, setFields)} />
                    ) : undefined}
                    title={t('advancedSectionTitle')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <FieldLabel htmlFor="group" fieldName="group">{t('customGroupNameLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="group"
                                name="group"
                                value={formData.group ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("group")}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="groups" fieldName="groups">{t('customProxyGroupsLabel')}</FieldLabel>
                            <textarea
                                id="groups"
                                name="groups"
                                value={formData.groups ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("groups")}
                                rows={2}
                                placeholder={t('customProxyGroupsPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('customProxyGroupsHelp')}</p>
                        </div>
                        <div>
                            <FieldLabel htmlFor="ruleset" fieldName="ruleset">{t('customRulesetLabel')}</FieldLabel>
                            <textarea
                                id="ruleset"
                                name="ruleset"
                                value={formData.ruleset ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("ruleset")}
                                rows={2}
                                placeholder={t('customRulesetPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('customRulesetHelp')}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <FieldLabel htmlFor="insert" fieldName="insert">{t('insertNodesLabel')}</FieldLabel>
                            <input
                                id="insert"
                                name="insert"
                                type="checkbox"
                                checked={formData.insert}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <FieldLabel htmlFor="prepend" fieldName="prepend">{t('prependInsertNodesLabel')}</FieldLabel>
                            <input
                                id="prepend"
                                name="prepend"
                                type="checkbox"
                                checked={formData.prepend}
                                onChange={handleInputChange}
                                className={checkboxClass}
                                disabled={!formData.insert}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="interval" fieldName="interval">{t('updateIntervalLabel')}</FieldLabel>
                            <input
                                type="number"
                                id="interval"
                                name="interval"
                                value={formData.interval ?? ''}
                                onChange={handleInputChange}
                                min="0"
                                className={getInputClass("interval")}
                            />
                        </div>
                        <div className="flex items-center">
                            <FieldLabel htmlFor="strict" fieldName="strict">{t('strictUpdateModeLabel')}</FieldLabel>
                            <input
                                id="strict"
                                name="strict"
                                type="checkbox"
                                checked={formData.strict}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="sort_script" fieldName="sort_script">{t('sortScriptUrlLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="sort_script"
                                name="sort_script"
                                value={formData.sort_script ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("sort_script")}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="filter" fieldName="filter">{t('filterScriptUrlLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="filter"
                                name="filter"
                                value={formData.filter ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("filter")}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="dev_id" fieldName="dev_id">{t('deviceIdLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="dev_id"
                                name="dev_id"
                                value={formData.dev_id ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("dev_id")}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="token" fieldName="token">{t('apiTokenLabel')}</FieldLabel>
                            <input
                                type="password"
                                id="token"
                                name="token"
                                value={formData.token ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("token")}
                            />
                        </div>
                        {/* Added Upload Fields */}
                        <div className="flex items-center space-x-2">
                            <input
                                id="upload"
                                name="upload"
                                type="checkbox"
                                checked={formData.upload}
                                onChange={handleInputChange}
                                className={checkboxClass}
                            />
                            <FieldLabel htmlFor="upload" fieldName="upload">{t('uploadResultLabel')}</FieldLabel>
                        </div>
                        <div>
                            <FieldLabel htmlFor="upload_path" fieldName="upload_path">{t('uploadPathLabel')}</FieldLabel>
                            <input
                                type="text"
                                id="upload_path"
                                name="upload_path"
                                value={formData.upload_path ?? ''}
                                onChange={handleInputChange}
                                className={getInputClass("upload_path")}
                                disabled={!formData.upload}
                                placeholder={t('uploadPathPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('uploadPathHelp')}</p>
                        </div>
                    </div>
                </CollapsibleFieldset>

                {/* Submission Bar */}
                <div className="panel mt-6 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 space-y-3">
                            <div className="flex items-center gap-2">
                                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                                <p className="text-sm leading-relaxed text-slate-300">
                                    {t('setFieldsInfo')} <span className="font-medium text-emerald-300">({t('fieldSet')})</span> {t('setFieldsInfoSuffix')}
                                </p>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-300 transition-colors hover:text-slate-100">
                                <input
                                    id="saveApiUrl"
                                    type="checkbox"
                                    checked={saveApiUrl}
                                    onChange={(e) => setSaveApiUrl(e.target.checked)}
                                    className={checkboxClass}
                                />
                                <span>{t('saveAsSubscription')}</span>
                            </label>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitDisabled || shortUrlCreating}
                                className={`${buttonClass} px-8 py-3`}
                            >
                                {isLoading ? (
                                    <>
                                        <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        {t('generatingButton')}
                                    </>
                                ) : (shortUrlCreating ? t('creatingShortUrlButton') : t('generateButton'))}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Results Section */}
            <div className="mt-8 space-y-4">
                {isLoading && !result && ( // Only show main loading if no result yet
                    <div className="panel rounded-xl p-8 text-center">
                        <span aria-hidden className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-300" />
                        <p className="mt-4 font-mono text-sm text-slate-300">{t('processing')}</p>
                    </div>
                )}

                {error && (
                    <div className="overflow-hidden rounded-xl border border-red-400/30 bg-red-500/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center gap-2.5 border-b border-red-400/20 px-5 py-3">
                            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]" />
                            <h3 className="text-sm font-semibold text-red-300">{commonT('error')}</h3>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-sm text-red-200/90">{error.error}</p>
                            {error.details && <p className="mt-1 font-mono text-xs text-red-300/70">{error.details}</p>}
                        </div>
                    </div>
                )}

                {result && !error && (
                    <div className="overflow-hidden rounded-xl border border-emerald-400/25 bg-emerald-500/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_40px_-28px_rgba(52,211,153,0.4)]">
                        {/* Result header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                                <h3 className="text-sm font-semibold text-emerald-300">{t('resultTitle')}</h3>
                            </div>
                            <span className="rounded-md border border-white/10 bg-[#060e1c]/80 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                                {result.content_type}
                            </span>
                        </div>

                        <div className="space-y-4 p-5">
                            {/* API URL Display */}
                            <div className="overflow-hidden rounded-lg border border-white/10 bg-[#060e1c]/70">
                                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        {t('subscriptionUrlDisplay')}
                                    </h4>
                                    <button
                                        onClick={() => copyToClipboard(shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl())}
                                        className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
                                    >
                                        {commonT('copy')}
                                    </button>
                                </div>
                                <p className="break-all border-t border-white/[0.07] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-cyan-100/85">
                                    {shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl()}
                                </p>
                                {shortUrlCreating && (
                                    <p className="border-t border-white/[0.07] px-3.5 py-2 text-xs text-cyan-300">
                                        <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border border-cyan-400/30 border-t-cyan-300 align-[-2px]" />
                                        {t('creatingShortUrl')}
                                    </p>
                                )}
                                <p className="border-t border-white/[0.07] px-3.5 py-2 text-xs text-slate-500">
                                    {t('useUrlMessage')}
                                    {saveApiUrl && !shortUrlCreated && !shortUrlCreating && t('urlWillBeSaved')}
                                    {shortUrlCreated && t('shortUrlMessage')}
                                </p>
                            </div>

                            <textarea
                                readOnly
                                value={result.content}
                                rows={15}
                                className="w-full rounded-lg border border-white/10 bg-[#04090f] p-3.5 font-mono text-sm leading-relaxed text-gray-200 focus:border-cyan-400/40 focus:outline-none"
                                aria-label={t('conversionResultAriaLabel')}
                                spellCheck={false}
                            />
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <button
                                    onClick={handleDownload}
                                    className={`${buttonClass} px-8 py-3`}
                                >
                                    <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                    </svg>
                                    {t('downloadConfigButton')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 