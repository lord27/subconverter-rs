'use client';

import React, { useState, useCallback, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
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

const FIELDSET_LEGEND_CLASS = 'text-lg font-semibold text-gray-100 mb-2';

interface CollapsibleFieldsetProps {
    title: React.ReactNode;
    children: React.ReactNode;
    /** Tailwind classes appended to the <fieldset> wrapper (border/accent). */
    className?: string;
    /** Tailwind classes for the legend text colour. */
    legendClassName?: string;
    /** Initial open state. */
    defaultOpen?: boolean;
}

/** A form section whose legend row can be clicked to collapse / expand its body. */
function CollapsibleFieldset({
    title,
    children,
    className = 'border-gray-300 shadow-sm',
    legendClassName = '',
    defaultOpen = true,
}: CollapsibleFieldsetProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <fieldset className={`p-4 border rounded-md ${className}`}>
            <legend className="w-full cursor-pointer select-none" onClick={() => setOpen((v) => !v)}>
                <span
                    className={`${FIELDSET_LEGEND_CLASS} ${legendClassName} flex items-center justify-between gap-2`}
                    aria-expanded={open}
                >
                    <span>{title}</span>
                    <svg
                        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            </legend>
            {open && children}
        </fieldset>
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

    // Basic styling using Tailwind (assuming setup)
    const inputClass = "mt-1 block w-full px-3 py-2 bg-[#0a1526]/85 border border-white/10 rounded-md shadow-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 focus:border-cyan-400/60 sm:text-sm";
    const checkboxClass = "h-4 w-4 text-cyan-400 border-white/20 rounded bg-[#0a1526] accent-cyan-400 focus:ring-cyan-400/30";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-cyan-400/40 disabled:opacity-50";
    const smallButtonClass = "px-3 py-1.5 text-xs rounded border transition-colors"; // For preset buttons

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
        const baseClass = "mt-1 block w-full px-3 py-2 bg-[#0a1526]/85 border rounded-md shadow-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 focus:border-cyan-400/60 sm:text-sm";
        if (setFields.has(fieldName)) {
            return `${baseClass} border-emerald-400/60`;
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
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="neon-text mb-6 text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-sky-100">
                {t('title')}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Section */}
                <CollapsibleFieldset title={t('requiredSectionTitle')}>
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
                    title={t('configSectionTitle')}
                    className="border-cyan-400/25 bg-cyan-400/[0.04]"
                    legendClassName="text-cyan-300"
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
                <CollapsibleFieldset title={t('filterRenameSectionTitle')}>
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
                                    <label htmlFor="emoji" className="ml-2 block text-sm text-gray-900">{t('emojiAddRemoveLabel')}</label>
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
                                    <label htmlFor="add_emoji" className="ml-2 block text-sm text-gray-900">{t('emojiAddOnlyLabel')}</label>
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
                                    <label htmlFor="remove_emoji" className="ml-2 block text-sm text-gray-900">{t('emojiRemoveOnlyLabel')}</label>
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
                <CollapsibleFieldset title={t('outputOptionsSectionTitle')}>
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
                <CollapsibleFieldset title={t('protocolFlagsSectionTitle')}>
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
                <CollapsibleFieldset title={t('advancedSectionTitle')}>
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

                {/* Submission Button */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        {t('setFieldsInfo')} <span className="text-green-600">({t('fieldSet')})</span> {t('setFieldsInfoSuffix')}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <input
                                id="saveApiUrl"
                                type="checkbox"
                                checked={saveApiUrl}
                                onChange={(e) => setSaveApiUrl(e.target.checked)}
                                className={checkboxClass}
                            />
                            <label htmlFor="saveApiUrl" className="ml-2 text-sm text-gray-700">
                                {t('saveAsSubscription')}
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitDisabled || shortUrlCreating}
                            className={buttonClass}
                        >
                            {isLoading ? t('generatingButton') : (shortUrlCreating ? t('creatingShortUrlButton') : t('generateButton'))}
                        </button>
                    </div>
                </div>
            </form>

            {/* Results Section */}
            <div className="mt-8">
                {isLoading && !result && ( // Only show main loading if no result yet
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-400">{t('processing')}</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 border border-red-400/50 bg-red-500/10 rounded-md">
                        <h3 className="text-lg font-semibold text-red-300">{commonT('error')}</h3>
                        <p className="text-red-200/90">{error.error}</p>
                        {error.details && <p className="mt-1 text-sm text-red-300/80">{error.details}</p>}
                    </div>
                )}

                {result && !error && (
                    <div className="p-4 border border-emerald-400/40 bg-emerald-500/[0.07] rounded-md">
                        <h3 className="text-lg font-semibold text-emerald-300">{t('resultTitle')}</h3>
                        <p className="text-sm text-gray-400 mb-2">{t('contentTypeLabel')}: {result.content_type}</p>

                        {/* API URL Display */}
                        <div className="mb-4 p-3 bg-[#060e1c]/70 border border-white/10 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-200">{t('subscriptionUrlDisplay')}</h4>
                                <button
                                    onClick={() => copyToClipboard(shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl())}
                                    className="text-xs px-2 py-1 bg-cyan-400/10 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/20 rounded"
                                >
                                    {commonT('copy')}
                                </button>
                            </div>
                            <p className="text-xs break-all font-mono bg-[#04090f] p-2 rounded border border-white/10 text-cyan-100/80">
                                {shortUrlData && shortUrlCreated ? shortUrlData.short_url : generateApiUrl()}
                            </p>
                            {shortUrlCreating && (
                                <p className="text-xs text-cyan-300 mt-1">{t('creatingShortUrl')}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {t('useUrlMessage')}
                                {saveApiUrl && !shortUrlCreated && !shortUrlCreating && t('urlWillBeSaved')}
                                {shortUrlCreated && t('shortUrlMessage')}
                            </p>
                        </div>

                        <textarea
                            readOnly
                            value={result.content}
                            rows={15}
                            className="w-full p-2 border border-white/10 rounded-md font-mono text-sm bg-[#04090f] text-gray-200"
                            aria-label={t('conversionResultAriaLabel')}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleDownload}
                                className={buttonClass}
                            >
                                {t('downloadConfigButton')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 