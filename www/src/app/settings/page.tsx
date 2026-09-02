"use client";

import { useState, useEffect } from 'react';
import { readSettingsFile, writeSettingsFile } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import yaml from 'js-yaml';
import CodeEditor from '@/components/CodeEditor';

// Settings interface based on pref.yml structure
interface SubconverterSettings {
    common?: {
        api_mode?: boolean;
        api_access_token?: string;
        default_url?: string[];
        enable_insert?: boolean;
        insert_url?: string[];
        prepend_insert_url?: boolean;
        exclude_remarks?: string[];
        include_remarks?: string[];
        enable_filter?: boolean;
        filter_script?: string;
        default_external_config?: string;
        base_path?: string;
        clash_rule_base?: string;
        surge_rule_base?: string;
        surfboard_rule_base?: string;
        mellow_rule_base?: string;
        quan_rule_base?: string;
        quanx_rule_base?: string;
        loon_rule_base?: string;
        sssub_rule_base?: string;
        singbox_rule_base?: string;
        proxy_config?: string;
        proxy_ruleset?: string;
        proxy_subscription?: string;
        append_proxy_type?: boolean;
        reload_conf_on_request?: boolean;
    };
    userinfo?: {
        stream_rule?: Array<{ match: string; replace: string }>;
        time_rule?: Array<{ match: string; replace: string }>;
    };
    node_pref?: {
        udp_flag?: boolean;
        tcp_fast_open_flag?: boolean;
        skip_cert_verify_flag?: boolean;
        tls13_flag?: boolean;
        sort_flag?: boolean;
        sort_script?: string;
        filter_deprecated_nodes?: boolean;
        append_sub_userinfo?: boolean;
        clash_use_new_field_name?: boolean;
        clash_proxies_style?: string;
        clash_proxy_groups_style?: string;
        singbox_add_clash_modes?: boolean;
        rename_node?: Array<{ match?: string; replace?: string; script?: string; import?: string }>;
    };
    managed_config?: {
        write_managed_config?: boolean;
        managed_config_prefix?: string;
        config_update_interval?: number;
        config_update_strict?: boolean;
        quanx_device_id?: string;
    };
    surge_external_proxy?: {
        surge_ssr_path?: string;
        resolve_hostname?: boolean;
    };
    emojis?: {
        add_emoji?: boolean;
        remove_old_emoji?: boolean;
        rules?: Array<{ match?: string; emoji?: string; script?: string; import?: string }>;
    };
    rulesets?: {
        enabled?: boolean;
        overwrite_original_rules?: boolean;
        update_ruleset_on_request?: boolean;
        rulesets?: Array<{ rule?: string; ruleset?: string; group?: string; interval?: number; import?: string }>;
    };
    proxy_groups?: {
        custom_proxy_group?: Array<{ name?: string; type?: string; rule?: string[]; url?: string; interval?: number; tolerance?: number; timeout?: number; import?: string }>;
    };
    template?: {
        template_path?: string;
        globals?: Array<{ key: string; value: any }>;
    };
    aliases?: Array<{ uri: string; target: string }>;
    tasks?: Array<{ name: string; cronexp: string; path: string; timeout?: number }>;
    server?: {
        listen?: string;
        port?: number;
        serve_file_root?: string;
    };
    advanced?: {
        log_level?: string;
        print_debug_info?: boolean;
        max_pending_connections?: number;
        max_concurrent_threads?: number;
        max_allowed_rulesets?: number;
        max_allowed_rules?: number;
        max_allowed_download_size?: number;
        enable_cache?: boolean;
        cache_subscription?: number;
        cache_config?: number;
        cache_ruleset?: number;
        script_clean_context?: boolean;
        async_fetch_ruleset?: boolean;
        skip_failed_links?: boolean;
    };
}

export default function SettingsPage() {
    const t = useTranslations('SettingsPage');
    const commonT = useTranslations('Common');

    const [settings, setSettings] = useState<SubconverterSettings>({});
    const [originalYaml, setOriginalYaml] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('common');
    const [yamlPreviewContent, setYamlPreviewContent] = useState('');

    // Add state to track unsaved changes in CodeEditors
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            try {
                const currentYaml = yaml.dump(settings, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                    sortKeys: false
                });
                setYamlPreviewContent(currentYaml);
            } catch (err) {
                console.error("Error generating YAML preview:", err);
                setYamlPreviewContent("# Error generating YAML preview");
            }
        }
    }, [settings, isLoading]);

    const loadSettings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const yamlContent = await readSettingsFile();
            setOriginalYaml(yamlContent);

            const parsedSettings = yaml.load(yamlContent) as SubconverterSettings;
            setSettings(parsedSettings || {});
        } catch (err) {
            setError(t('loadError', { message: err instanceof Error ? err.message : String(err) }));
            console.error("Error loading settings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        setError(null);

        try {
            const yamlContent = yaml.dump(settings, {
                indent: 2,
                lineWidth: -1, // Don't wrap lines
                noRefs: true,
                sortKeys: false // Preserve key order
            });

            await writeSettingsFile(yamlContent);
            setOriginalYaml(yamlContent);
            setSaveSuccess(true);

            // Hide success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError(t('saveError', { message: err instanceof Error ? err.message : String(err) }));
            console.error("Error saving settings:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (section: keyof SubconverterSettings, key: string, value: any) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: value
            }
        }));
    };

    // Handle array input changes (like exclude_remarks)
    const handleArrayChange = (section: keyof SubconverterSettings, key: string, value: string) => {
        const arrayValue = value.split(',').map(item => item.trim());
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: arrayValue
            }
        }));
    };

    // Callback for CodeEditor save
    const handleCodeEditorSave = () => {
        setHasUnsavedChanges(false); // Reset unsaved changes flag on successful save
        // Optionally: show a success message specific to the editor
    };

    // Callback for CodeEditor change
    const handleCodeEditorChange = () => {
        setHasUnsavedChanges(true); // Set unsaved changes flag
    };

    const renderCommonSection = () => {
        const common = settings.common || {};
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('common.apiMode')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={common.api_mode ? "true" : "false"}
                            onChange={(e) => handleInputChange('common', 'api_mode', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('common.apiAccessToken')}</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={common?.api_access_token || ''}
                            onChange={(e) => handleInputChange('common', 'api_access_token', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('common.defaultUrl')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded bg-white/10"
                        value={(common?.default_url || []).join(', ')}
                        onChange={(e) => handleArrayChange('common', 'default_url', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-400">{t('common.defaultUrlHelp')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('common.enableInsert')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={common?.enable_insert ? "true" : "false"}
                            onChange={(e) => handleInputChange('common', 'enable_insert', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('common.prependInsertUrl')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={common?.prepend_insert_url ? "true" : "false"}
                            onChange={(e) => handleInputChange('common', 'prepend_insert_url', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('common.insertUrl')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded bg-white/10"
                        value={(common?.insert_url || []).join(', ')}
                        onChange={(e) => handleArrayChange('common', 'insert_url', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-400">{t('common.insertUrlHelp')}</p>
                </div>
            </div>
        );
    };

    const renderServerSection = () => {
        const server = settings.server || {};
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="status-dot bg-emerald-400" />
                    <h3 className="font-mono text-sm font-semibold tracking-wide text-cyan-200">{t('server.title')}</h3>
                </div>
                <p className="mb-4 text-xs text-gray-400">{t('server.description')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">{t('server.listen')}</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-white/10 rounded bg-[#0a1526]/85 text-gray-100 placeholder:text-gray-500"
                            value={server?.listen || ''}
                            onChange={(e) => handleInputChange('server', 'listen', e.target.value)}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('server.listenHelp')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">{t('server.port')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-white/10 rounded bg-[#0a1526]/85 text-gray-100 placeholder:text-gray-500"
                            value={server?.port || ''}
                            onChange={(e) => handleInputChange('server', 'port', parseInt(e.target.value) || 0)}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('server.portHelp')}</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">{t('server.serveFileRoot')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-white/10 rounded bg-[#0a1526]/85 text-gray-100 placeholder:text-gray-500"
                        value={server?.serve_file_root || ''}
                        onChange={(e) => handleInputChange('server', 'serve_file_root', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('server.serveFileRootHelp')}</p>
                </div>
            </div>
        );
    };

    const renderAdvancedSection = () => {
        const advanced = settings.advanced || {};
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.logLevel')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.log_level || 'info'}
                            onChange={(e) => handleInputChange('advanced', 'log_level', e.target.value)}
                        >
                            <option value="debug">{t('advanced.levels.debug')}</option>
                            <option value="info">{t('advanced.levels.info')}</option>
                            <option value="warn">{t('advanced.levels.warning')}</option>
                            <option value="error">{t('advanced.levels.error')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.printDebugInfo')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.print_debug_info ? "true" : "false"}
                            onChange={(e) => handleInputChange('advanced', 'print_debug_info', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.maxPendingConnections')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.max_pending_connections || ''}
                            onChange={(e) => handleInputChange('advanced', 'max_pending_connections', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.maxConcurrentThreads')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.max_concurrent_threads || ''}
                            onChange={(e) => handleInputChange('advanced', 'max_concurrent_threads', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.maxAllowedRulesets')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.max_allowed_rulesets || ''}
                            onChange={(e) => handleInputChange('advanced', 'max_allowed_rulesets', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.maxAllowedRules')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.max_allowed_rules || ''}
                            onChange={(e) => handleInputChange('advanced', 'max_allowed_rules', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.maxAllowedDownloadSize')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.max_allowed_download_size || ''}
                            onChange={(e) => handleInputChange('advanced', 'max_allowed_download_size', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.enableCache')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.enable_cache ? "true" : "false"}
                            onChange={(e) => handleInputChange('advanced', 'enable_cache', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.skipFailedLinks')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.skip_failed_links ? "true" : "false"}
                            onChange={(e) => handleInputChange('advanced', 'skip_failed_links', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.cacheSettings.subscription')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.cache_subscription || ''}
                            onChange={(e) => handleInputChange('advanced', 'cache_subscription', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.cacheSettings.config')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.cache_config || ''}
                            onChange={(e) => handleInputChange('advanced', 'cache_config', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('advanced.cacheSettings.ruleset')}</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={advanced?.cache_ruleset || ''}
                            onChange={(e) => handleInputChange('advanced', 'cache_ruleset', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderNodePrefSection = () => {
        const nodePref = settings.node_pref || {};
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.udp')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.udp_flag === undefined ? "" : (nodePref?.udp_flag ? "true" : "false")}
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    const newSettings = { ...settings };
                                    if (newSettings.node_pref) {
                                        delete newSettings.node_pref.udp_flag;
                                        setSettings(newSettings);
                                    }
                                } else {
                                    handleInputChange('node_pref', 'udp_flag', e.target.value === "true");
                                }
                            }}
                        >
                            <option value="">{t('notSet')}</option>
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.tcpFastOpen')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.tcp_fast_open_flag === undefined ? "" : (nodePref?.tcp_fast_open_flag ? "true" : "false")}
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    const newSettings = { ...settings };
                                    if (newSettings.node_pref) {
                                        delete newSettings.node_pref.tcp_fast_open_flag;
                                        setSettings(newSettings);
                                    }
                                } else {
                                    handleInputChange('node_pref', 'tcp_fast_open_flag', e.target.value === "true");
                                }
                            }}
                        >
                            <option value="">{t('notSet')}</option>
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.skipCertVerify')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.skip_cert_verify_flag === undefined ? "" : (nodePref?.skip_cert_verify_flag ? "true" : "false")}
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    const newSettings = { ...settings };
                                    if (newSettings.node_pref) {
                                        delete newSettings.node_pref.skip_cert_verify_flag;
                                        setSettings(newSettings);
                                    }
                                } else {
                                    handleInputChange('node_pref', 'skip_cert_verify_flag', e.target.value === "true");
                                }
                            }}
                        >
                            <option value="">{t('notSet')}</option>
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.tls13')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.tls13_flag === undefined ? "" : (nodePref?.tls13_flag ? "true" : "false")}
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    const newSettings = { ...settings };
                                    if (newSettings.node_pref) {
                                        delete newSettings.node_pref.tls13_flag;
                                        setSettings(newSettings);
                                    }
                                } else {
                                    handleInputChange('node_pref', 'tls13_flag', e.target.value === "true");
                                }
                            }}
                        >
                            <option value="">{t('notSet')}</option>
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.sort')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.sort_flag ? "true" : "false"}
                            onChange={(e) => handleInputChange('node_pref', 'sort_flag', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.filterDeprecated')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.filter_deprecated_nodes ? "true" : "false"}
                            onChange={(e) => handleInputChange('node_pref', 'filter_deprecated_nodes', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.flags.appendSubUserInfo')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.append_sub_userinfo ? "true" : "false"}
                            onChange={(e) => handleInputChange('node_pref', 'append_sub_userinfo', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.clashSettings.useNewFieldName')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.clash_use_new_field_name ? "true" : "false"}
                            onChange={(e) => handleInputChange('node_pref', 'clash_use_new_field_name', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.singboxAddClashModes')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.singbox_add_clash_modes ? "true" : "false"}
                            onChange={(e) => handleInputChange('node_pref', 'singbox_add_clash_modes', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.clashSettings.proxiesStyle')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.clash_proxies_style || 'flow'}
                            onChange={(e) => handleInputChange('node_pref', 'clash_proxies_style', e.target.value)}
                        >
                            <option value="flow">Flow</option>
                            <option value="block">Block</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nodePref.clashSettings.proxyGroupsStyle')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={nodePref?.clash_proxy_groups_style || 'flow'}
                            onChange={(e) => handleInputChange('node_pref', 'clash_proxy_groups_style', e.target.value)}
                        >
                            <option value="flow">Flow</option>
                            <option value="block">Block</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderEmojisSection = () => {
        const emojis = settings.emojis || {};
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('emojis.addEmoji')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={emojis?.add_emoji ? "true" : "false"}
                            onChange={(e) => handleInputChange('emojis', 'add_emoji', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('emojis.removeOldEmoji')}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded bg-white/10"
                            value={emojis?.remove_old_emoji ? "true" : "false"}
                            onChange={(e) => handleInputChange('emojis', 'remove_old_emoji', e.target.value === "true")}
                        >
                            <option value="true">{commonT('enabled')}</option>
                            <option value="false">{commonT('disabled')}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('emojis.rules')}</label>
                    <p className="text-xs mb-2 text-gray-400">
                        {t('emojis.emojiFileHint')}
                    </p>
                </div>
            </div>
        );
    };

    const renderSnippetsSection = () => { // New function for snippets tab
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">emoji.txt</h3>
                    <p className="text-sm text-gray-400 mb-2">{t('snippets.emojiFileDesc')}</p>
                    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden h-96">
                        <CodeEditor
                            filePath="snippets/emoji.txt"
                            language="plaintext"
                            onSave={handleCodeEditorSave}
                            onChange={handleCodeEditorChange}
                        />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">gistconf.ini</h3>
                    <p className="text-sm text-gray-400 mb-2">{t('snippets.gistConfDesc')}</p>
                    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden h-96">
                        <CodeEditor
                            filePath="gistconf.ini"
                            language="ini"
                            onSave={handleCodeEditorSave}
                            onChange={handleCodeEditorChange}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'common':
                return renderCommonSection();
            case 'server':
                return renderServerSection();
            case 'advanced':
                return renderAdvancedSection();
            case 'node_pref':
                return renderNodePrefSection();
            case 'emojis':
                return renderEmojisSection();
            case 'snippets': // Add case for snippets
                return renderSnippetsSection();
            default:
                return <p className="text-sm text-gray-400">{t('defaultTabMessage')}</p>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <div className="mb-4 text-xl">{t('loading')}</div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                    <h1 className="text-4xl font-bold mb-4 sm:mb-0 text-center">{t('title')}</h1>
                    <Link
                        href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {t('backToHome')}
                    </Link>
                </div>

                {error && (
                    <div className="border-l-4 border-red-400/70 bg-red-500/10 p-4 text-red-200/90 mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {saveSuccess && (
                    <div className="border-l-4 border-emerald-400/70 bg-emerald-500/10 p-4 text-emerald-200/90 mb-6">
                        <p>{t('saveSuccess')}</p>
                    </div>
                )}

                <div className="bg-white/5 rounded-lg shadow-md overflow-hidden">
                    <div className="flex flex-wrap border-b border-gray-300">
                        {/* Pref.yml related tabs */}
                        <button
                            className={`px-4 py-2 ${activeTab === 'common' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('common')}
                        >
                            {t('tabs.common')}
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'server' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('server')}
                        >
                            {t('tabs.server')}
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'advanced' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('advanced')}
                        >
                            {t('tabs.advanced')}
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'node_pref' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('node_pref')}
                        >
                            {t('tabs.node_pref')}
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'emojis' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('emojis')}
                        >
                            {t('tabs.emojis')}
                        </button>

                        {/* Separator (Optional visual cue) */}
                        <div className="border-l border-gray-400 mx-2"></div>

                        {/* Direct file editing tabs */}
                        <button // Add Snippets tab button
                            className={`px-4 py-2 ${activeTab === 'snippets' ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
                            onClick={() => setActiveTab('snippets')}
                        >
                            {t('snippets.title')}
                        </button>
                    </div>

                    <div className="p-6">
                        {renderTab()}

                        {/* Only show Save button for settings tabs, not snippets */}
                        {activeTab !== 'snippets' && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    onClick={saveSettings}
                                    disabled={isSaving}
                                >
                                    {isSaving ? t('savingSettings') : t('saveButton')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conditionally render YAML Preview */}
                {activeTab !== 'snippets' && (
                    <div className="panel mt-8 rounded-xl p-6">
                        <h2 className="mb-1 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
                            {t('yamlPreview.title')}
                        </h2>
                        <div className="mt-4 h-96 overflow-hidden rounded-lg border border-white/10 bg-[#04090f]">
                            <CodeEditor
                                filePath="pref.yaml (Preview)"
                                language="yaml"
                                value={yamlPreviewContent}
                                options={{ readOnly: true }}
                            />
                        </div>
                        <p className="mt-3 text-xs text-gray-400">
                            {t('yamlPreview.note', { file: 'pref.yml' })}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}