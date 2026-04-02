"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { X } from "lucide-react";
import { ProfanityModal } from "./ProfanityModal";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    currentUsername: string;
    currentAboutMe?: string;
    currentDiscordLink?: string;
    onSuccess: (newName: string, newUsername: string, newAboutMe: string, newDiscordLink: string) => void;
}

export function EditProfileModal({ isOpen, onClose, currentName, currentUsername, currentAboutMe = "", currentDiscordLink = "", onSuccess }: EditProfileModalProps) {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(currentName);
    const [username, setUsername] = useState(currentUsername);
    const [aboutMe, setAboutMe] = useState(currentAboutMe);
    const [discordLink, setDiscordLink] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [notifyBadWords, setNotifyBadWords] = useState(false);
    const [showProfanityModal, setShowProfanityModal] = useState(false);
    const [badWord, setBadWord] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
            setUsername(currentUsername);
            setAboutMe(currentAboutMe);
            setDiscordLink(currentDiscordLink || "");
            setNotifyBadWords(user?.notifyBadWords || false);
            setStatus("idle");
            setErrorMsg("");
        }
    }, [isOpen, currentName, currentUsername, currentAboutMe, currentDiscordLink, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e?: React.FormEvent, ignoreProfanity = false) => {
        if (e) e.preventDefault();

        if (!name.trim() || !username.trim()) {
            setErrorMsg("Name and username cannot be empty.");
            setStatus("error");
            return;
        }

        const validUsernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!validUsernameRegex.test(username)) {
            setErrorMsg("Username must be 3-20 characters long and can only contain letters, numbers, and underscores.");
            setStatus("error");
            return;
        }

        setStatus("loading");

        try {
            const token = localStorage.getItem("excalibur_user"); // or some auth token if we had one

            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.id,
                    name: name.trim(),
                    username: username.toLowerCase().trim(),
                    aboutMe: aboutMe.trim(),
                    discordLink: discordLink.trim(),
                    notifyBadWords,
                    ignoreProfanity
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "Profanity detected") {
                    setBadWord(data.badWord);
                    setShowProfanityModal(true);
                    setStatus("idle");
                    return;
                }
                throw new Error(data.error || "Failed to update profile");
            }

            // Sync the updated user profile locally
            if (user) {
                const updatedUser = { 
                    ...user, 
                    name: name.trim(), 
                    username: username.toLowerCase().trim(), 
                    aboutMe: aboutMe.trim(),
                    discordLink: discordLink.trim(),
                    notifyBadWords 
                };
                updateUser(updatedUser);
            }

            setStatus("success");
            onSuccess(name.trim(), username.toLowerCase().trim(), aboutMe.trim(), discordLink.trim());
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message);
            setStatus("error");
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="Your display name"
                            maxLength={30}
                        />
                        <p className="text-xs text-gray-500 mt-1">This is how you appear to others.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-gray-500">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                className="w-full bg-dark-bg/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                placeholder="unique_username"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Unique identifier. Changing this will change your profile URL.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">About Me</label>
                        <textarea
                            value={aboutMe}
                            onChange={(e) => setAboutMe(e.target.value)}
                            rows={3}
                            className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
                            placeholder="Tell the community about yourself..."
                            maxLength={250}
                        />
                        <p className="text-xs text-gray-500 mt-1">Short biography for your profile page.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Discord Profile / Link</label>
                        <input
                            type="text"
                            value={discordLink}
                            onChange={(e) => setDiscordLink(e.target.value)}
                            className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="username#0000 or discord.gg/..."
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">Share your Discord for community connection.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                        <input
                            type="checkbox"
                            id="notifyBadWords"
                            checked={notifyBadWords}
                            onChange={(e) => setNotifyBadWords(e.target.checked)}
                            className="w-4 h-4 rounded text-violet-500 bg-dark-bg/50 border-white/20 focus:ring-violet-500 focus:ring-offset-dark-surface"
                        />
                        <label htmlFor="notifyBadWords" className="text-sm font-medium text-gray-300 select-none">
                            Receive alerts if someone posts a bad word on my assets (Not recommended for large pages)
                        </label>
                    </div>

                    {status === "error" && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                            {errorMsg}
                        </div>
                    )}

                    {status === "success" && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm">
                            Profile updated successfully!
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading" || status === "success"}
                        className="w-full neon-button py-3 mt-4 rounded-xl text-white font-bold disabled:opacity-50"
                    >
                        {status === "loading" ? "Saving..." : "Save Changes"}
                    </button>
                </form>

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
        </div>
    );
}
