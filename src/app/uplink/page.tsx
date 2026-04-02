"use client";

import React from "react";
import { UplinkForm } from "@/components/ui/UplinkForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGoogleLogin } from "@react-oauth/google";

export default function UplinkPage() {
    const { user, login } = useAuth();

    const signIn = useGoogleLogin({
        onSuccess: (codeResponse) => {
            login(codeResponse);
        },
        onError: () => console.log('Login Failed'),
    });

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-dark-bg -z-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full"></div>
            </div>

            {!user ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto glass-panel p-10 rounded-3xl">
                    <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-gray-400 mb-8">You must be signed in with your Google identity to access the Uplink Portal and upload creations to the marketplace.</p>
                    <button
                        onClick={() => signIn()}
                        className="w-full py-4 neon-button rounded-xl font-bold text-white text-lg tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                    >
                        Authenticate Now
                    </button>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <UplinkForm />
                </div>
            )}
        </div>
    );
}
