"use client";

import { useState, useEffect } from "react";
import {
    getEndpointsConfig,
    saveEndpointsConfig,
    EndpointsConfig,
    ConversionEndpoint,
} from "@/lib/api-client";

const EMPTY_DRAFT: ConversionEndpoint = { id: "", name: "", base_url: "", path: "/api/sub" };

interface EndpointManagerProps {
    /** Called whenever the persisted config changes so the parent can refresh dropdowns. */
    onConfigChange?: (config: EndpointsConfig) => void;
}

/**
 * Manage the server-side conversion endpoint configuration.
 *
 * Short links created from conversion parameters are "permanent": they store
 * structured params, and at redirect time the server resolves them against the
 * currently ENABLED endpoint (default_endpoint). Switching the enabled endpoint
 * here re-points all such links automatically.
 */
export default function EndpointManager({ onConfigChange }: EndpointManagerProps) {
    const [config, setConfig] = useState<EndpointsConfig>({ endpoints: [], default_endpoint: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<ConversionEndpoint>(EMPTY_DRAFT);

    useEffect(() => {
        loadConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const cfg = await getEndpointsConfig();
            setConfig(cfg);
            onConfigChange?.(cfg);
            setError(null);
        } catch (err: any) {
            setError(err.error || "Failed to load endpoint config");
            console.error("Error loading endpoint config:", err);
        } finally {
            setLoading(false);
        }
    };

    const persist = async (next: EndpointsConfig) => {
        try {
            await saveEndpointsConfig(next);
            setConfig(next);
            onConfigChange?.(next);
            setError(null);
        } catch (err: any) {
            setError(err.error || "Failed to save endpoint config");
            console.error("Error saving endpoint config:", err);
            throw err;
        }
    };

    const handleSetEnabled = async (id: string) => {
        await persist({ ...config, default_endpoint: id });
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Delete endpoint "${id}"?`)) return;
        const endpoints = config.endpoints.filter((ep) => ep.id !== id);
        const default_endpoint =
            config.default_endpoint === id ? (endpoints[0]?.id ?? "") : config.default_endpoint;
        await persist({ endpoints, default_endpoint });
    };

    const startAdd = () => {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
        setShowForm(true);
    };

    const startEdit = (ep: ConversionEndpoint) => {
        setEditingId(ep.id);
        setDraft({ id: ep.id, name: ep.name, base_url: ep.base_url || "", path: ep.path || "/api/sub" });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = draft.id.trim();
        const name = draft.name.trim();
        if (!id || !name) {
            setError("ID and name are required");
            return;
        }
        if (config.endpoints.some((ep) => ep.id === id && ep.id !== editingId)) {
            setError(`Endpoint ID "${id}" already exists`);
            return;
        }

        const normalized: ConversionEndpoint = {
            id,
            name,
            base_url: draft.base_url.trim(),
            path: (draft.path || "/api/sub").trim() || "/api/sub",
        };

        if (editingId) {
            const endpoints = config.endpoints.map((ep) => (ep.id === editingId ? normalized : ep));
            const default_endpoint =
                config.default_endpoint === editingId ? normalized.id : config.default_endpoint;
            await persist({ endpoints, default_endpoint });
        } else {
            await persist({
                endpoints: [...config.endpoints, normalized],
                default_endpoint: config.default_endpoint,
            });
        }

        setShowForm(false);
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
    };

    const enabledEndpoint = config.endpoints.find((ep) => ep.id === config.default_endpoint);

    return (
        <div className="bg-white/10 p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Conversion Endpoints</h2>
                <button
                    type="button"
                    onClick={() => setShowPanel(!showPanel)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                    {showPanel ? "Hide" : "Manage"}
                </button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
                {loading
                    ? "Loading endpoint configuration..."
                    : config.endpoints.length === 0
                        ? "No endpoints configured yet. Short links will redirect to this site's /api/sub."
                        : enabledEndpoint
                            ? `Enabled endpoint: ${enabledEndpoint.name} (${enabledEndpoint.id}) — all permanent short links redirect there.`
                            : "No endpoint is enabled. Add one and click \"Enable\" to route short links to it."}
            </p>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 mb-4 rounded-lg">
                    {error}
                </div>
            )}

            {showPanel && (
                <div>
                    {config.endpoints.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {config.endpoints.map((ep) => (
                                <div
                                    key={ep.id}
                                    className="border border-gray-700 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold truncate">{ep.name}</span>
                                            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
                                                {ep.id}
                                            </span>
                                            {config.default_endpoint === ep.id && (
                                                <span className="bg-green-500/30 text-green-300 text-xs px-2 py-0.5 rounded-full">
                                                    Enabled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 break-all">
                                            {ep.base_url || "(current site)"}
                                            {ep.path ? ep.path : "/api/sub"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2">
                                        {config.default_endpoint !== ep.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetEnabled(ep.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded"
                                            >
                                                Enable
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => startEdit(ep)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold py-1 px-3 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(ep.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showForm ? (
                        <form onSubmit={handleSubmit} className="border border-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block mb-1 text-sm">ID*</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
                                        value={draft.id}
                                        onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                                        placeholder="main"
                                        disabled={editingId !== null}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm">Name*</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
                                        value={draft.name}
                                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                        placeholder="Main server"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm">Base URL</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
                                        value={draft.base_url}
                                        onChange={(e) => setDraft({ ...draft, base_url: e.target.value })}
                                        placeholder="https://sub.example.com or empty for this site"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Leave empty to use the current site (origin of the request).
                                    </p>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm">API Path</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
                                        value={draft.path}
                                        onChange={(e) => setDraft({ ...draft, path: e.target.value })}
                                        placeholder="/api/sub"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    {editingId ? "Save Endpoint" : "Add Endpoint"}
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            type="button"
                            onClick={startAdd}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            + Add Endpoint
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
