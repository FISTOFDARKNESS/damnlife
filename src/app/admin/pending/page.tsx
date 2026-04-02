"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Flag, Sparkles } from "lucide-react";

export default function PendingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.email !== "kaioadrik08@gmail.com")) {
            notFound();
        }
    }, [user, isLoading]);

    const fetchPending = async () => {
        try {
            const res = await fetch("/api/assets/moderate");
            const data = await res.json();
            if (data.success) {
                setAssets(data.assets);
            }
        } catch (error) {
            console.error("Failed to fetch pending assets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.email === "kaioadrik08@gmail.com") {
            fetchPending();
        }
    }, [user]);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        let reason = "";
        if (action === "reject") {
            reason = window.prompt("Enter rejection reason:") || "No reason provided.";
        }

        try {
            const res = await fetch(`/api/assets/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetId: id, action, reason, adminEmail: user?.email })
            });

            const data = await res.json();
            if (data.success) {
                // Remove from list
                setAssets(prev => prev.filter(a => a.id !== id));
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Action failed.");
        }
    };

    if (isLoading || loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!isLoading && (!user || user.email !== "kaioadrik08@gmail.com")) {
        notFound();
    }

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-dark-bg -z-20 overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none"></div>
            </div>

            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 mb-4 tracking-tight">
                    Asset Approvals
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl font-light">
                    Review and approve community submitted assets before they appear on the public marketplace.
                </p>
                
                <div className="mt-6 flex gap-4">
                    <Link href="/admin/reports" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-xl font-bold transition-all transition-colors cursor-pointer">
                        <Flag size={20} /> Go to User Reports
                    </Link>
                </div>
            </div>

            {assets.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-3xl border-dashed border-2 border-white/10">
                    <Sparkles size={64} className="mb-4 block opacity-50 mx-auto text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Caught Up!</h2>
                    <p className="text-gray-400">There are no pending assets in the moderation queue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {assets.map((asset) => (
                        <div key={asset.id} className="glass-panel rounded-3xl overflow-hidden border border-white/10 flex flex-col transition-all hover:border-violet-500/50">
                            {/* Preview */}
                            <div className="w-full aspect-video bg-dark-surface relative group">
                                {asset.thumbnailUrl ? (
                                    <img src={asset.thumbnailUrl} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-600">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <Link href={`/asset/${asset.id}`} target="_blank" className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-white line-clamp-1 mb-2">{asset.title}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{asset.description}</p>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-300 font-bold overflow-hidden">
                                        {asset.authorPicture ? <img src={asset.authorPicture} alt="A" /> : asset.author.substring(0, 2)}
                                    </div>
                                    <span className="text-sm text-gray-400">{asset.author}</span>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex items-center gap-3">
                                    <button
                                        onClick={() => handleAction(asset.id, "reject")}
                                        className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-colors border border-red-500/20"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(asset.id, "approve")}
                                        className="flex-1 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-sm transition-colors border border-green-500/20"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
