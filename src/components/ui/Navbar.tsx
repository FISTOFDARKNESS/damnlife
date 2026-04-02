"use client";

import React, { useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useGoogleLogin } from "@react-oauth/google";
import Link from 'next/link';
import { SearchBar } from "./SearchBar";
import { NotificationDropdown } from "./NotificationDropdown";

import { SettingsModal } from "./SettingsModal";

export function Navbar() {
    const { user, login, logout, isLoading } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const signIn = useGoogleLogin({
        onSuccess: (codeResponse) => {
            // Pass the response to our AuthProvider's login function
            login(codeResponse);
        },
        onError: () => console.log('Login Failed'),
    });

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass border-b border-white/10 flex items-center justify-between transition-all duration-300">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                    <span className="text-white font-bold text-xl tracking-tighter">EX</span>
                </div>
                <span className="text-white font-semibold text-xl tracking-wide hidden lg:block">Excalibur Store</span>
            </Link>

            {/* Search Bar */}
            <SearchBar />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6 ml-auto mr-8">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Marketplace</Link>
                <Link href="/uplink" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Uplink</Link>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
                {isLoading ? (
                    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
                ) : user ? (
                    <div className="flex items-center gap-1">
                        <NotificationDropdown />
                        <div className="flex items-center gap-4 relative group" ref={menuRef}>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user.name}</p>
                                <p className="text-xs text-gray-400">@{user.username || user.name.split(' ')[0]}</p>
                            </div>
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full border-2 border-violet-500/50 cursor-pointer hover:border-violet-500 transition-colors"
                            />
                            {/* Dropdown on hover */}
                            <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
                                <Link
                                    href={`/profile/${user.username || user.name.replace(/\s+/g, '').toLowerCase()}`}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-1"
                                >
                                    My Profile
                                </Link>
                                {user.email === "kaioadrik08@gmail.com" && (
                                    <Link
                                        href="/admin/pending"
                                        className="block w-full text-left px-4 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-white/5 rounded-lg transition-colors mb-1 font-bold"
                                    >
                                        Asset Approvals
                                    </Link>
                                )}
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-1"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn()}
                        className="px-6 py-2 rounded-lg text-sm font-medium text-white neon-button"
                    >
                        Connect Identity
                    </button>
                )}
            </div>
        </nav>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
