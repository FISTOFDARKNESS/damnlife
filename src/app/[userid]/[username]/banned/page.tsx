"use client";

import React, { use, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Ban, LogOut, Clock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BannedPage({ params }: { params: Promise<{ userid: string; username: string }> }) {
    const { userid, username } = use(params);
    const { user, logout } = useAuth();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Local loop for ticking the expiration counter safely on the client
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Prevent anyone who isn't banned from snooping on this protected page
    useEffect(() => {
        // Allow rendering if not fully loaded, or if the current viewer matched the URL and is actually banned
        if (user && user.id === userid && !user.banned?.isBanned) {
            router.replace("/");
        } else if (user && user.id !== userid && user.email !== "kaioadrik08@gmail.com") {
            router.replace("/");
        }
    }, [user, userid, router]);

    const handleLogout = () => {
        logout();
        router.replace("/");
    };

    if (!user || user.id !== userid || !user.banned?.isBanned) {
        return null;
    }

    const { reason, type, expiresAt } = user.banned;

    let timeLeftMsg = "";
    let isExpired = false;

    if (type === "temp" && expiresAt) {
        const expiresMs = new Date(expiresAt).getTime();
        const diffMs = expiresMs - currentTime;
        if (diffMs <= 0) {
            isExpired = true;
            timeLeftMsg = "Your ban has expired! Please log out and back in to restore your access.";
        } else {
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            timeLeftMsg = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-center">
            {/* Dramatic Red/Black Background Pulse */}
            <div className="absolute inset-0 bg-red-950 opacity-40 animate-pulse pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/20 blur-[150px] pointer-events-none" />

            <div className="relative glass-panel bg-black/60 border border-red-500/50 p-10 md:p-14 rounded-[3rem] shadow-[0_0_80px_rgba(239,68,68,0.3)] max-w-2xl w-full z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/50">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-wider">
                    Account Banned
                </h1>
                
                <p className="text-gray-300 text-lg mb-10 max-w-md mx-auto">
                    Your access to the Excalibur Network has been restricted due to a violation of our community guidelines.
                </p>

                <div className="bg-dark-surface border border-white/5 rounded-2xl p-6 text-left mb-10">
                    <div className="mb-4">
                        <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Ban Reason</span>
                        <p className="text-white mt-1 text-lg font-medium">{reason || "No specific reason provided."}</p>
                    </div>

                    <div className="mb-4">
                        <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Penalty Type</span>
                        <p className="text-white mt-1 capitalize flex items-center gap-2">
                            <Ban size={16} className="text-red-500" /> {type === "perm" ? "Permanent Suspension" : "Temporary Suspension"}
                        </p>
                    </div>

                    {type === "temp" && (
                        <div>
                            <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Time Remaining</span>
                            <p className={`mt-1 font-mono text-xl ${isExpired ? "text-green-400" : "text-yellow-400"} flex items-center gap-2`}>
                                <Clock size={18} /> {timeLeftMsg}
                            </p>
                        </div>
                    )}
                </div>

                {type === "perm" && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm mb-8 font-medium">
                        This ban is permanent and cannot be appealed automatically. If you believe this is a severe mistake, please contact support.
                    </div>
                )}

                <button 
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-8 rounded-2xl transition-colors uppercase tracking-wide text-sm"
                >
                    <LogOut size={18} /> Disconnect Identity
                </button>
            </div>
        </div>
    );
}
