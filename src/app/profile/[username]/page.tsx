"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AssetCard } from "@/components/ui/AssetCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssetData } from "@/components/ui/AssetModal";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { FollowListModal } from "@/components/ui/FollowListModal";
import { BanModal } from "@/components/ui/BanModal";
import { Ban, Calendar, Mail, ArrowRight, Rocket, MessageSquare } from "lucide-react";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { user: authUser, isLoading: authLoading } = useAuth();
    const [viewedUser, setViewedUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [myAssets, setMyAssets] = useState<AssetData[]>([]);
    const [favoritedAssets, setFavoritedAssets] = useState<AssetData[]>([]);
    const [activeTab, setActiveTab] = useState<"published" | "favorites">("published");
    const [loadingAssets, setLoadingAssets] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    
    // Modal State for Followers/Following Lists
    const [followListModal, setFollowListModal] = useState<{isOpen: boolean, title: string, ids: string[]}>({
        isOpen: false,
        title: "",
        ids: []
    });

    const router = useRouter();

    // Avoid hydration mismatch by rendering only after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!username) return;

        setLoadingAssets(true);
        // Fetch the user's profile and their assets concurrently
        Promise.all([
            fetch(`/api/users/${username}`).then(res => res.json()),
            fetch("/api/assets").then(res => res.json())
        ])
            .then(([userData, assetsData]) => {
                if (userData.success && userData.profile) {
                    // Smart Redirect: If accessed by ID but username is available, redirect to pretty URL
                    if (userData.profile.username && username !== userData.profile.username) {
                        router.replace(`/profile/${userData.profile.username}`);
                        return;
                    }

                    setViewedUser(userData.profile);
                    if (assetsData.success) {
                        setMyAssets(assetsData.assets.filter((a: any) => a.ownerId === userData.profile.id));
                    }
                    const followers = Array.isArray(userData.profile.followers) ? userData.profile.followers : [];
                    if (authUser?.id && followers.includes(authUser.id)) {
                        setIsFollowing(true);
                    } else {
                        setIsFollowing(false);
                    }
                    if (assetsData.success) {
                        setMyAssets(assetsData.assets.filter((a: any) => a.ownerId === userData.profile.id));
                        setFavoritedAssets(assetsData.assets.filter((a: any) => Array.isArray(userData.profile.favorites) && userData.profile.favorites.includes(a.id)));
                    }
                } else {
                    setFetchError("User not found.");
                }
            })
            .catch(err => {
                console.error(err);
                setFetchError("Failed to load profile.");
            })
            .finally(() => setLoadingAssets(false));
    }, [username]);

    if (!mounted || loadingAssets || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (fetchError || !viewedUser) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] text-center px-4">
                <div className="glass-panel p-10 rounded-3xl max-w-lg w-full">
                    <Ban size={64} className="mb-6 block mx-auto text-red-500" />
                    <h2 className="text-2xl font-bold mb-4">{fetchError || "User Not Found"}</h2>
                    <p className="text-gray-400 mb-8">The profile you are looking for does not exist.</p>
                    <Link href="/" className="neon-button py-3 px-6 rounded-xl text-white font-semibold">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = authUser?.id === viewedUser?.id;

    const handleFollow = async () => {
        if (!authUser || isFollowLoading) return;
        setIsFollowLoading(true);
        try {
            const res = await fetch(`/api/users/${username}/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followerId: authUser.id })
            });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(data.isFollowing);
                setViewedUser({
                    ...viewedUser,
                    followers: data.isFollowing
                        ? [...(Array.isArray(viewedUser.followers) ? viewedUser.followers : []), authUser.id]
                        : (Array.isArray(viewedUser.followers) ? viewedUser.followers : []).filter((id: string) => id !== authUser.id)
                });
            }
        } catch (err) { 
            console.error(err); 
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleVerifyToggle = async () => {
        try {
            const res = await fetch(`/api/users/${username}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminEmail: authUser?.email, verified: !viewedUser.verified })
            });
            const data = await res.json();
            if (data.success) {
                setViewedUser({ ...viewedUser, verified: data.verified });
            }
        } catch (err) { console.error(err); }
    };

    const handleBanAction = async (banned: boolean, reason?: string, type?: "temp" | "perm", expiresAt?: string) => {
        try {
            const res = await fetch(`/api/users/${username}/ban`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminEmail: authUser?.email, banned, reason, type, expiresAt })
            });
            const data = await res.json();
            if (data.success) {
                setViewedUser({ ...viewedUser, banned: data.profile.banned });
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative rounded-3xl overflow-hidden mb-12 border border-white/5">
                {/* Banner */}
                <div className="h-48 md:h-64 cosmic-banner w-full relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                    <div className="absolute -bottom-16 left-8 sm:left-12 flex items-end gap-6 z-10 w-full animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="relative animate-float">
                            <img
                                src={viewedUser.picture}
                                alt={viewedUser.name}
                                className="w-32 h-32 rounded-2xl border-4 border-dark-bg object-cover shadow-[0_0_30px_rgba(139,92,246,0.5)] bg-dark-surface animate-pulse-glow"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-dark-bg z-20" title="Online" />
                        </div>

                        <div className="mb-4">
                            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2">
                                {viewedUser.name}
                                {viewedUser.verified && (
                                    <span title="Verified" className="text-blue-400 flex items-center justify-center">
                                        <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </span>
                                )}
                            </h1>
                            <p className="text-violet-400 font-medium">@{viewedUser.username || viewedUser.name.split(' ')[0]}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-dark-surface/80 glass backdrop-blur-xl pt-20 pb-8 px-8 sm:px-12 flex flex-wrap gap-8 justify-between items-center sm:items-start">
                    <div className="flex gap-8">
                        <div 
                            onClick={() => setFollowListModal({isOpen: true, title: "Followers", ids: Array.isArray(viewedUser.followers) ? viewedUser.followers : []})}
                            className="flex flex-col cursor-pointer group hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors"
                        >
                            <span className="text-2xl font-bold text-white group-hover:text-violet-400 transition-colors">{Array.isArray(viewedUser.followers) ? viewedUser.followers.length : 0}</span>
                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Followers</span>
                        </div>
                        <div 
                            onClick={() => setFollowListModal({isOpen: true, title: "Following", ids: Array.isArray(viewedUser.following) ? viewedUser.following : []})}
                            className="flex flex-col cursor-pointer group hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors"
                        >
                            <span className="text-2xl font-bold text-white group-hover:text-violet-400 transition-colors">{Array.isArray(viewedUser.following) ? viewedUser.following.length : 0}</span>
                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Following</span>
                        </div>
                        <div className="flex flex-col p-2 -m-2">
                            <span className="text-2xl font-bold text-white">{myAssets.length}</span>
                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Assets</span>
                        </div>
                        <div className="flex flex-col p-2 -m-2">
                            <span className="text-2xl font-bold text-white">
                                {myAssets.reduce((sum, asset) => sum + (asset.likesCount || 0), 0)}
                            </span>
                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Likes</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap mt-6 sm:mt-0">
                        {isOwner ? (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-6 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : authUser && (
                            <button
                                onClick={handleFollow}
                                disabled={isFollowLoading}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] ${isFollowing
                                        ? "bg-white/10 border border-white/20 text-white"
                                        : "neon-button text-white"
                                    }`}
                            >
                                {isFollowLoading ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                ) : (
                                    isFollowing ? "Following" : "Follow"
                                )}
                            </button>
                        )}

                        {authUser?.email === "kaioadrik08@gmail.com" && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleVerifyToggle}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${viewedUser.verified
                                            ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20"
                                            : "bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20"
                                        }`}
                                >
                                    {viewedUser.verified ? "Remove Verification" : "Verify Account"}
                                </button>
                                
                                <button
                                    onClick={() => viewedUser.banned?.isBanned ? handleBanAction(false) : setIsBanModalOpen(true)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border flex items-center gap-1 ${viewedUser.banned?.isBanned
                                            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                                            : "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20"
                                        }`}
                                >
                                    <Ban size={14} />
                                    {viewedUser.banned?.isBanned ? "Unban User" : "Ban User"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar */}
                <div className="glass-panel p-6 rounded-3xl h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        About Me
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
                        {viewedUser.aboutMe || "No bio provided yet."}
                    </p>

                    <div className="space-y-4 border-t border-white/5 pt-6">
                        {viewedUser.discordLink && (
                            <a 
                                href={viewedUser.discordLink.startsWith('http') ? viewedUser.discordLink : `https://discord.gg/${viewedUser.discordLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-sm text-blue-400 font-semibold group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.747 11.747 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292.077.051.077.127.001.128a12.81 12.81 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </div>
                                <span className="hover:underline">{viewedUser.discordLink}</span>
                            </a>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Calendar size={16} /> Joined {viewedUser.joinedAt ? new Date(viewedUser.joinedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </div>
                        {isOwner && (
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Mail size={16} /> {viewedUser.email}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setActiveTab("published")} 
                                className={`text-xl md:text-2xl font-bold transition-colors ${activeTab === "published" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                {isOwner ? "My Assets" : "Published Assets"}
                            </button>
                            <button 
                                onClick={() => setActiveTab("favorites")} 
                                className={`text-xl md:text-2xl font-bold transition-colors ${activeTab === "favorites" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                Favorites
                            </button>
                        </div>
                        {isOwner && activeTab === "published" && (
                            <Link href="/uplink" className="text-sm text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-2">
                                Upload New
                                <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>

                    {loadingAssets ? (
                        <div className="flex justify-center items-center h-32 w-full">
                            <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
                        </div>
                    ) : (activeTab === "published" ? myAssets : favoritedAssets).length === 0 ? (
                        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 hover:border-violet-500/30 transition-colors">
                            <Rocket size={48} className="mb-4 opacity-50 mx-auto" />
                            <h3 className="text-xl font-bold text-white mb-2">No assets yet</h3>
                            <p className="text-gray-400 mb-6 max-w-sm">
                                {activeTab === "published" 
                                    ? "This user hasn't uploaded any assets yet." 
                                    : "This user hasn't favorited any assets yet."}
                            </p>
                            {isOwner && activeTab === "published" && (
                                <Link href="/uplink" className="neon-button py-3 px-8 rounded-xl font-semibold text-white">
                                    Go to Uplink
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(activeTab === "published" ? myAssets : favoritedAssets).map((asset) => (
                                <AssetCard
                                    key={asset.id}
                                    id={asset.id}
                                    title={asset.title}
                                    author={asset.author || viewedUser.name}
                                    authorPicture={asset.authorPicture || viewedUser.picture}
                                    price={asset.price}
                                    thumbnailUrl={asset.thumbnailUrl}
                                    tags={asset.tags}
                                    likesCount={asset.likesCount}
                                    averageRating={asset.averageRating}
                                    totalReviews={asset.totalReviews}
                                    ownerId={asset.ownerId}
                                    ownerUsername={asset.ownerUsername}
                                    onClick={() => router.push(`/asset/${asset.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isOwner && viewedUser && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentName={viewedUser.name}
                    currentUsername={viewedUser.username || viewedUser.name.split(' ')[0]}
                    currentAboutMe={viewedUser.aboutMe || ""}
                    currentDiscordLink={viewedUser.discordLink || ""}
                    onSuccess={(newName, newUsername, newAboutMe, newDiscordLink) => {
                        setIsEditModalOpen(false);
                        // If username changed, redirect
                        if (newUsername !== (viewedUser.username || viewedUser.name.split(' ')[0])) {
                            router.push(`/profile/${newUsername}`);
                        } else {
                            // Optionally mutate/refresh current user
                            setViewedUser({ ...viewedUser, name: newName, aboutMe: newAboutMe, discordLink: newDiscordLink });
                        }
                    }}
                />
            )}

            <FollowListModal
                isOpen={followListModal.isOpen}
                onClose={() => setFollowListModal({ ...followListModal, isOpen: false })}
                title={followListModal.title}
                userIds={followListModal.ids}
            />

            {authUser?.email === "kaioadrik08@gmail.com" && (
                <BanModal
                    isOpen={isBanModalOpen}
                    username={viewedUser.name}
                    onClose={() => setIsBanModalOpen(false)}
                    onConfirm={(reason, type, expiresAt) => handleBanAction(true, reason, type, expiresAt)}
                />
            )}
        </div>
    );
}
