"use client";

import React, { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Check, FileText, Plus } from "lucide-react";
import { ProfanityModal } from "./ProfanityModal";

export function UplinkForm() {
    const { user } = useAuth();

    const [formData, setFormData] = useState({ title: "", description: "" });
    const [priceType, setPriceType] = useState<"Free" | "Paid">("Free");
    const [isLimited, setIsLimited] = useState(false);
    const [downloadLimit, setDownloadLimit] = useState(10);
    const [files, setFiles] = useState<{ thumbnail?: File, preview?: File, binary?: File }>({});
    const [status, setStatus] = useState<"idle" | "tagging" | "uploading_files" | "finalizing" | "success" | "error">("idle");
    const [generatedTags, setGeneratedTags] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [showProfanityModal, setShowProfanityModal] = useState(false);
    const [badWord, setBadWord] = useState("");

    const MAX_SIZE = 25 * 1024 * 1024;

    const allowedTypes = {
        binary: [
            "application/octet-stream",
            "application/xml",
            "text/xml"
        ],
        thumbnail: [
            "image/png",
            "image/jpeg"
        ],
        preview: [
            "video/mp4"
        ]
    };

    const allowedExtensions = {
        binary: [".rbxm", ".rbxl", ".rbxmx"],
        thumbnail: [".png", ".jpg", ".jpeg"],
        preview: [".mp4", ".mov", ".avi"]
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "thumbnail" | "preview" | "binary"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = "." + file.name.split(".").pop()?.toLowerCase();

        if (!allowedExtensions[type].includes(ext)) {
            setErrorMessage(`Invalid file type for ${type}. Allowed: ${allowedExtensions[type].join(", ")}`);
            e.target.value = "";
            return;
        }

        if (!allowedTypes[type].includes(file.type) && type !== "binary") {
            setErrorMessage(`Invalid MIME type for ${type}.`);
            e.target.value = "";
            return;
        }

        if (file.size > MAX_SIZE) {
            setErrorMessage("File too large. Maximum size is 25MB.");
            e.target.value = "";
            return;
        }

        setErrorMessage("");
        setFiles(prev => ({ ...prev, [type]: file }));
    };

    const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e?: React.FormEvent, ignoreProfanity = false) => {
        if (e) e.preventDefault();
        if (!formData.title || !formData.description) {
            setErrorMessage("Please provide a title and description.");
            return;
        }
        if (!user) {
            setErrorMessage("You must be signed in to upload assets.");
            return;
        }

        try {
            setErrorMessage("");
            setStatus("tagging");

            // Step 1: Metadata Tagging
            const tagsRes = await fetch("/api/gemini/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: formData.title, description: formData.description })
            });
            if (!tagsRes.ok) throw new Error("Failed to generate AI tags.");
            const tagsData = await tagsRes.json();
            setGeneratedTags(tagsData.tags);

            setStatus("uploading_files");

            // Encode Files to Base64
            const items: Record<string, string> = {};
            if (files.thumbnail) items.thumbnail = await toBase64(files.thumbnail);
            if (files.preview) items.preview = await toBase64(files.preview);
            if (files.binary) items.binary = await toBase64(files.binary);

            if (!items.binary) throw new Error("A Roblox binary file (.rbxm, .rbxl, .rbxmx) is required.");
            if (!items.thumbnail) throw new Error("A thumbnail image is required.");
            if (!items.preview) throw new Error("A video preview is required.");

            // Format Tags
            const manualTags = customTags.split(",")
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

            const finalTags = Array.from(new Set([...(tagsData.tags || []), ...manualTags]));

            const binaryExt = "." + files.binary!.name.split(".").pop()?.toLowerCase();

            // Metadata to send
            const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const metadata = {
                id: assetId,
                ownerId: user.id,
                author: user.name || "Anonymous",
                authorPicture: user.picture || "",
                title: formData.title,
                description: formData.description,
                price: priceType,
                isLimited: isLimited,
                maxDownloads: isLimited ? downloadLimit : 0,
                tags: finalTags.length > 0 ? finalTags : ["Unverified"],
                extension: binaryExt,
                createdAt: new Date().toISOString(),
                ownerUsername: user.username
            };

            setStatus("finalizing");

            // Step 2-5: Execute sequential uploads via our Next.js API route
            const uploadRes = await fetch("/api/github/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, assetId, metadata, ignoreProfanity })
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                
                if (uploadRes.status === 429) {
                    setErrorMessage(errData.details || "Upload limit reached. Verified users get higher limits.");
                    setStatus("error");
                    return;
                }

                if (errData.error === "Profanity detected") {
                    setBadWord(errData.badWord);
                    setShowProfanityModal(true);
                    setStatus("idle");
                    return;
                }
                throw new Error(errData.details || errData.error || "Upload failed.");
            }

            setStatus("success");
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "An unexpected error occurred.");
            setStatus("error");
        }
    };

    // Status mapping to UI phases
    const getStatusMessage = () => {
        switch (status) {
            case "tagging": return "Analyzing asset metadata...";
            case "uploading_files": return "Encrypting and uploading files...";
            case "finalizing": return "Publishing asset to global registry...";
            case "success": return "Asset uploaded successfully!";
            case "error": return `Error: ${errorMessage}`;
            default: return "";
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto glass-panel p-8 rounded-2xl relative overflow-hidden">
            {/* Background glow decoration */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Uplink Portal
            </h2>
            <p className="text-gray-400 mb-8 border-b border-white/10 pb-6 text-sm">
                Securely publish your creations. Our system automatically generates optimized SEO keywords.
            </p>

            {status === "success" ? (
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Uplink Complete</h3>
                    <p className="text-sm text-gray-300 mb-4">
                        Your asset has been distributed globally. Generated tags:
                        <strong className="text-violet-300 ml-1">{generatedTags.join(", ")}</strong>
                    </p>
                    <button onClick={() => setStatus("idle")} className="neon-button px-6 py-2 rounded-xl text-sm font-semibold text-white">
                        Upload Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Asset Title</label>
                            <input
                                type="text"
                                className="w-full glass bg-dark-bg/50 border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-white placeholder-gray-600"
                                placeholder="e.g. Next-Gen Sports Car"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                disabled={status !== "idle" && status !== "error"}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                rows={3}
                                className="w-full glass bg-dark-bg/50 border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-white placeholder-gray-600 resize-none"
                                placeholder="Describe your model, its features, and how to use it..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={status !== "idle" && status !== "error"}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Pricing Model</label>
                            <select
                                value={priceType}
                                onChange={e => setPriceType(e.target.value as any)}
                                disabled={status !== "idle" && status !== "error"}
                                className="w-full glass bg-dark-bg/50 border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-white outline-none appearance-none"
                            >
                                <option value="Free">Free</option>
                                <option value="Paid" disabled>Paid (Coming Soon)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">Monetization features are currently unavailable. All assets uploaded will be listed as Free.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Manual Tags (Optional)</label>
                            <input
                                type="text"
                                className="w-full glass bg-dark-bg/50 border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-white placeholder-gray-600"
                                placeholder="e.g. Vehicles, Open Source, Drifting"
                                value={customTags}
                                onChange={e => setCustomTags(e.target.value)}
                                disabled={status !== "idle" && status !== "error"}
                            />
                            <p className="text-xs text-gray-500 mt-2">Comma separated. Our system will automatically merge these with its own generated tags.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 glass-panel border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-300">Limited Edition?</span>
                                <button
                                    type="button"
                                    onClick={() => setIsLimited(!isLimited)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isLimited ? 'bg-orange-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isLimited ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {isLimited && (
                                <div className="flex-1 flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-400">Download Limit:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={downloadLimit}
                                        onChange={e => setDownloadLimit(parseInt(e.target.value) || 1)}
                                        className="w-24 glass bg-dark-bg/50 border-white/10 rounded-lg px-3 py-1 text-white text-center focus:border-orange-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            {/* File Inputs */}
                            {[
                                { type: "binary", label: "Roblox File (Max: 25mb)", accept: ".rbxm, .rbxl, .rbxmx" },
                                { type: "thumbnail", label: "Thumbnail (Max: 25mb) *", accept: "image/png, image/jpeg" },
                                { type: "preview", label: "Video Preview (Max: 25mb) *", accept: "video/mp4" }
                            ].map((field) => (
                                <div key={field.type} className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{field.label} {field.type === "binary" && "*"}</span>
                                    <label className="flex flex-col items-center justify-center h-24 glass hover:bg-white/5 border border-dashed border-white/20 hover:border-violet-500/50 rounded-xl cursor-pointer transition-colors">
                                        <div className="mb-2 text-gray-400">{files[field.type as keyof typeof files] ? <FileText size={28} /> : <Plus size={28} />}</div>
                                        <span className="text-[10px] text-gray-400 px-2 text-center line-clamp-1">
                                            {files[field.type as keyof typeof files]?.name || field.accept}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept={field.accept}
                                            onChange={e => handleFileChange(e, field.type as any)}
                                            disabled={status !== "idle" && status !== "error"}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {status !== "idle" && (
                        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${status === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-violet-500/10 text-violet-300 border border-violet-500/20"}`}>
                            {status !== "error" && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                            {getStatusMessage()}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status !== "idle" && status !== "error"}
                        className="w-full neon-button py-4 rounded-xl text-white font-bold tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm mt-4"
                    >
                        {status === "idle" || status === "error" ? "Initiate Uplink" : "Processing..."}
                    </button>
                </form>
            )}

            <ProfanityModal
                isOpen={showProfanityModal}
                badWord={badWord}
                onCancel={() => setShowProfanityModal(false)}
                onConfirm={() => {
                    setShowProfanityModal(false);
                    handleSubmit(undefined, true);
                }}
            />
        </div>
    );
}
