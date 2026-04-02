"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, Trash2 } from "lucide-react";
import { ProfanityModal } from "./ProfanityModal";

interface AssetManagerProps {
    assetId: string;
    ownerId: string;
    initialTitle: string;
    initialDescription: string;
}

export function AssetManager({ assetId, ownerId, initialTitle, initialDescription }: AssetManagerProps) {
    const { user } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription || "");
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [showProfanityModal, setShowProfanityModal] = useState(false);
    const [badWord, setBadWord] = useState("");

    const isAdmin = user?.email === "kaioadrik08@gmail.com";
    // Only render if the currently logged-in user is the owner of the asset or an admin
    if (!user || (user.id !== ownerId && !isAdmin)) return null;

    const handleDelete = async () => {
        setStatus("loading");
        try {
            const res = await fetch(`/api/assets/${assetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ownerId: user.id, email: user.email })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }

            alert("Asset deleted successfully.");
            router.push("/profile");
        } catch (error: any) {
            setStatus("error");
            setErrorMsg(error.message);
        }
    };

    const handleUpdate = async (e?: React.FormEvent, ignoreProfanity = false) => {
        if (e) e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch(`/api/assets/${assetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ownerId: user.id, email: user.email, title, description, ignoreProfanity })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "Profanity detected") {
                    setBadWord(data.badWord);
                    setShowProfanityModal(true);
                    setStatus("idle");
                    return;
                }
                throw new Error(data.error || "Failed to update");
            }

            setIsEditing(false);
            setStatus("idle");
            router.refresh(); // Refresh page to show new metadata
        } catch (error: any) {
            setStatus("error");
            setErrorMsg(error.message);
        }
    };

    return (
        <div className="w-full mb-8">
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 py-3 px-6 rounded-xl font-bold border border-violet-500/50 text-violet-300 hover:bg-violet-500/10 transition-colors uppercase text-sm"
                >
                    {isEditing ? "Cancel Edit" : <span className="flex items-center justify-center gap-2"><Settings size={16} /> Edit Asset</span>}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={status === "loading"}
                    className="flex-1 py-3 px-6 rounded-xl font-bold border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors uppercase text-sm disabled:opacity-50"
                >
                    {status === "loading" && isDeleting ? "Deleting..." : <span className="flex items-center justify-center gap-2"><Trash2 size={16} /> Delete Asset</span>}
                </button>
            </div>

            {errorMsg && (
                <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                    {errorMsg}
                </div>
            )}

            {isEditing && (
                <form onSubmit={handleUpdate} className="glass-panel p-6 rounded-2xl space-y-4 border border-violet-500/30">
                    <h3 className="text-xl font-bold text-white mb-4">Edit Metadata</h3>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500 resize-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full neon-button py-3 rounded-xl font-bold text-white uppercase text-sm"
                    >
                        {status === "loading" ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            )}

            <ProfanityModal
                isOpen={showProfanityModal}
                badWord={badWord}
                onCancel={() => setShowProfanityModal(false)}
                onConfirm={() => {
                    setShowProfanityModal(false);
                    handleUpdate(undefined, true);
                }}
            />
        </div>
    );
}
