"use client";

import React, { useEffect, useState } from "react";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Package, Heart } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LikeButton } from "@/components/ui/LikeButton";
import Link from "next/link";

export interface AssetData {
    id: string;
    title: string;
    author: string;
    authorPicture?: string;
    price: string | number;
    thumbnailUrl?: string;
    videourl?: string;
    tags?: string[];
    description?: string;
    downloads?: number;
    extension?: string;
    likesCount?: number;
    averageRating?: number;
    totalReviews?: number;
    createdAt?: string;
    ownerId?: string;
    ownerUsername?: string;
    isLimited?: boolean;
    maxDownloads?: number;
}

interface AssetModalProps {
    asset: AssetData;
    onClose: () => void;
}

export function AssetModal({ asset, onClose }: AssetModalProps) {
    const { user } = useAuth();

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-violet-500/10 animate-in fade-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors border border-white/10 backdrop-blur-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Side: Media Preview */}
                <div className="w-full md:w-1/2 bg-dark-bg/60 border-r border-white/5 flex items-center justify-center p-6 relative group overflow-hidden">

                    {/* Glow background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition duration-500 blur-2xl" />

                    {asset.videourl ? (
                        <div className="relative w-full h-full">

                            <video
                                className="w-full rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.25)] border border-white/5 object-cover aspect-video md:aspect-auto md:h-full transition-transform duration-700 group-hover:scale-[1.03]"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                            >
                                <source src={asset.videourl} type="video/mp4" />
                            </video>

                            {/* Cinematic overlay */}
                            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

                        </div>

                    ) : asset.thumbnailUrl ? (
                        <img
                            src={asset.thumbnailUrl}
                            alt={asset.title}
                            className="w-full rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.25)] border border-white/5 object-cover aspect-video md:aspect-auto md:h-full transition-transform duration-700 group-hover:scale-[1.03]"
                        />

                    ) : (
                        <div className="w-full aspect-video md:aspect-auto md:h-full rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 flex flex-col items-center justify-center border border-white/5">

                            <Package size={80} className="mb-4 opacity-30 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] text-white" />

                            <p className="text-gray-500 font-medium">
                                Preview Not Available
                            </p>

                        </div>
                    )}

                </div>
                {/* Right Side: Info & Actions */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                    {/* Tags */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {asset.tags?.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                        {asset.title}
                    </h2>

                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                        {asset.authorPicture ? (
                            <img src={asset.authorPicture} alt={asset.author} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-white uppercase">{asset.author.substring(0, 2)}</span>
                            </div>
                        )}
                        <p className="text-gray-400 font-medium">
                            Created by {asset.ownerUsername ? (
                                <Link 
                                    href={`/profile/${asset.ownerUsername}`} 
                                    className="text-white hover:text-violet-400 transition-colors cursor-pointer font-bold"
                                >
                                    {asset.author}
                                </Link>
                            ) : (
                                <span className="text-white font-bold">{asset.author}</span>
                            )}
                        </p>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Description</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            {asset.description || "This high-quality asset is currently missing a detailed description. However, you can expect top-tier performance and plug-and-play integration for your Roblox experiences."}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {/* Download Stats */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Downloads</p>
                                <p className="text-xl font-bold text-white">
                                    {asset.downloads || 0}
                                    {asset.isLimited && (
                                        <span className="text-sm text-gray-500 ml-2">/ {asset.maxDownloads}</span>
                                    )}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Type</p>
                                <p className="text-xl font-bold text-white transition-colors">
                                    {asset.isLimited ? (
                                        <span className="text-orange-400">Limited</span>
                                    ) : (
                                        <span className="text-violet-400">Standard</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {asset.isLimited && (
                            <div className="mt-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Scarcity Level</span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {Math.round(((asset.downloads || 0) / (asset.maxDownloads || 1)) * 100)}% Taken
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-600 to-red-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${Math.min(100, ((asset.downloads || 0) / (asset.maxDownloads || 1)) * 100)}%` }}
                                    />
                                </div>
                                {(asset.downloads || 0) >= (asset.maxDownloads || 0) && (
                                    <p className="text-[10px] text-red-400 font-bold mt-2 animate-pulse uppercase tracking-tighter">
                                        This item is out of stock. It will no longer be available for download.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-semibold uppercase">Price</span>
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                {asset.price === 0 || asset.price === "Free" ? "Free" : `${asset.price} R$`}
                            </span>
                        </div>

                        <div className="ml-auto flex items-center gap-3">
                            <LikeButton 
                                assetId={asset.id} 
                                initialLikesCount={asset.likesCount || 0} 
                            />

                            <DownloadButton
                                assetId={asset.id}
                                fileUrl={`/api/proxy/thumbnail?assetId=${asset.id}&type=file&ext=${encodeURIComponent(asset.extension || '.rbxm')}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
