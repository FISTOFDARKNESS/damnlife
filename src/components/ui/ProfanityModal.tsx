"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ProfanityModalProps {
    isOpen: boolean;
    badWord: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ProfanityModal({ isOpen, badWord, onConfirm, onCancel }: ProfanityModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-panel max-w-md w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-300 border border-red-500/30">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2">Warning</h2>
                    <p className="text-gray-300 mb-6">
                        You are about to use a blocked word: <span className="font-bold text-red-400">"{badWord}"</span>. 
                        Are you sure you want to send this? Your content will be flagged.
                    </p>

                    <div className="flex w-full gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 transition-colors"
                        >
                            Send Anyway
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
