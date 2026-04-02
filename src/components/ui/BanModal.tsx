"use client";

import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";

interface BanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, type: "temp" | "perm", expiresAt?: string) => void;
    username: string;
}

export function BanModal({ isOpen, onClose, onConfirm, username }: BanModalProps) {
    const [reason, setReason] = useState("");
    const [type, setType] = useState<"temp" | "perm">("temp");
    const [durationHours, setDurationHours] = useState(24);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let expiresAt;
        if (type === "temp") {
            const date = new Date();
            date.setHours(date.getHours() + durationHours);
            expiresAt = date.toISOString();
        }

        onConfirm(reason, type, expiresAt);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md glass-panel bg-black/80 border border-red-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-red-500/10">
                    <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                        <ShieldAlert size={20} /> Ban {username}
                    </h2>
                    <button onClick={onClose} className="text-red-400 hover:text-red-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Ban Reason</label>
                        <input
                            type="text"
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="e.g. Spamming inappropriate assets"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Ban Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setType("temp")}
                                className={`py-2 rounded-xl border text-sm font-semibold transition-colors ${type === "temp" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500" : "bg-white/5 border-white/10 text-gray-400"}`}
                            >
                                Temporary
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("perm")}
                                className={`py-2 rounded-xl border text-sm font-semibold transition-colors ${type === "perm" ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-white/5 border-white/10 text-gray-400"}`}
                            >
                                Permanent
                            </button>
                        </div>
                    </div>

                    {type === "temp" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Duration (Hours)</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={durationHours}
                                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                                className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                    )}

                    <div className="pt-4 border-t border-red-500/20 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        >
                            Issue Ban
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
