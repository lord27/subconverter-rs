'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EXTERNAL_CONFIG_OPTIONS } from '@/generated/external-configs';

/**
 * Dropdown that lets the user pick an external rule-set config (INI) from the
 * configs bundled with the site (`/base/config`, `/config/Aethersailor`, ...),
 * or fall back to a free-form custom URL / remote link when nothing bundled
 * fits ("自定义 URL / 远程链接…").
 */
interface ExternalConfigSelectProps {
    id?: string;
    /** Current config value (a bundled INI path, a custom URL, or ''). */
    value: string;
    onChange: (value: string) => void;
    /** Tailwind classes applied to the <select> and the custom URL input. */
    className?: string;
}

/** Sentinel select value that reveals the free-form custom URL input. */
const CUSTOM_VALUE = '__custom__';

export default function ExternalConfigSelect({
    id,
    value,
    onChange,
    className,
}: ExternalConfigSelectProps) {
    const t = useTranslations('Common');
    // Whether the user explicitly chose the "custom URL" row in the dropdown
    // (needed so picking it while `value` is still empty shows the input).
    const [customEditing, setCustomEditing] = useState(false);

    // Group bundled INIs by the directory they ship in (optgroup labels).
    const groups = useMemo(() => {
        const map = new Map<string, { value: string; label: string }[]>();
        for (const opt of EXTERNAL_CONFIG_OPTIONS) {
            const list = map.get(opt.group) ?? [];
            list.push({ value: opt.value, label: opt.label });
            map.set(opt.group, list);
        }
        return Array.from(map.entries());
    }, []);

    const isKnown = value !== '' && EXTERNAL_CONFIG_OPTIONS.some((o) => o.value === value);
    const isCustom = value !== '' && !isKnown;
    const selectValue = customEditing || isCustom ? CUSTOM_VALUE : value;

    const handleSelect = (next: string) => {
        if (next === CUSTOM_VALUE) {
            // Keep editing the current value; the free-form input appears below.
            setCustomEditing(true);
            return;
        }
        setCustomEditing(false);
        onChange(next); // '' clears the config, otherwise a bundled INI path
    };

    const inputClassName =
        className ??
        'w-full rounded-lg border border-white/10 bg-[#0a1526]/85 px-4 py-2.5 text-sm text-gray-100 ' +
            'placeholder:text-gray-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20';

    return (
        <div className="space-y-2">
            <select
                id={id}
                value={selectValue}
                onChange={(e) => handleSelect(e.target.value)}
                className={inputClassName}
            >
                <option value="">{t('externalConfigSelectPlaceholder')}</option>
                <option value={CUSTOM_VALUE}>{t('externalConfigCustom')}</option>
                {groups.map(([group, options]) => (
                    <optgroup key={group} label={group}>
                        {options.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>

            {(customEditing || isCustom) && (
                <input
                    type="text"
                    aria-label={t('externalConfigCustom')}
                    className={inputClassName}
                    value={value}
                    onChange={(e) => {
                        setCustomEditing(true);
                        onChange(e.target.value);
                    }}
                    placeholder={t('externalConfigCustomPlaceholder')}
                />
            )}
        </div>
    );
}
