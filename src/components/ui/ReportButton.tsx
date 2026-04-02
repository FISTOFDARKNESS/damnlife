"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGoogleLogin } from "@react-oauth/google";

interface ReportButtonProps {
    type: "asset" | "comment";
    targetId: string;
    assetId: string;
}

export function ReportButton({ type, targetId, assetId }: ReportButtonProps) {
    const { user, login } = useAuth();
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    const signIn = useGoogleLogin({
        onSuccess: (codeResponse) => login(codeResponse),
        onError: () => console.error("Login Failed"),
    });

    const handleReport = async () => {
        if (!user || !reportReason.trim()) return;
        
        setIsReporting(true);
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    targetId,
                    assetId,
                    reason: reportReason,
                    reporterEmail: user.email
                })
            });
            
            if (res.ok) {
                alert("Reported successfully.");
                setReportModalOpen(false);
                setReportReason("");
            } else {
                alert("Failed to report.");
            }
        } catch (error) {
            console.error("Report error:", error);
        } finally {
            setIsReporting(false);
        }
    };

    const handleClick = () => {
        if (!user) {
            signIn();
            return;
        }
        setReportModalOpen(true);
    };

    return (
        <>
            <button 
                onClick={handleClick}
                className="p-3 text-yellow-500/70 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors border border-transparent hover:border-yellow-500/30 flex items-center justify-center"
                title={`Report ${type}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
            </button>

            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Report {type === 'asset' ? 'Asset' : 'Comment'}</h3>
                        <p className="text-sm text-gray-400 mb-4">Please provide a reason. This will go to the moderation queue.</p>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Reason for report..."
                            className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none mb-4 h-24 resize-none"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setReportModalOpen(false); setReportReason(""); }}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={isReporting || !reportReason.trim()}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50"
                            >
                                {isReporting ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
