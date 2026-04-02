"use client";

import React, { useState } from "react";
import { Package, Heart, Star } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import Link from "next/link";

interface AssetCardProps {
    id: string;
    title: string;
    author: string;
    authorPicture?: string;
    price: string | number; // e.g., "Free" or "500 Robux"
    thumbnailUrl?: string;
    authorVerified?: boolean;
    tags?: string[];
    likesCount?: number;
    averageRating?: number;
    totalReviews?: number;
    createdAt?: string;
    ownerId?: string;
    ownerUsername?: string;
    isLimited?: boolean;
    maxDownloads?: number;
    currentDownloads?: number;
    onClick?: () => void;
}

export function AssetCard({ id, title, author, authorPicture, authorVerified, price, thumbnailUrl, tags = [], likesCount, averageRating, totalReviews, createdAt, ownerId, ownerUsername, isLimited, maxDownloads, currentDownloads, onClick }: AssetCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Check if asset is new (less than 48 hours old)
    const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < (48 * 60 * 60 * 1000) : false;

    return (
        <div
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden glass-panel cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.5)]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Thumbnail Area */}
            <div className="absolute inset-0 bg-dark-surface/50 overflow-hidden">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/40 to-fuchsia-900/10">
                        <Package size={64} className="mb-2 opacity-50" />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent opacity-80" />

                {/* (NEW) Badge */}
                {isNew && !isLimited && (
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-fuchsia-600 border border-fuchsia-400 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-fuchsia-600/30 animate-pulse">
                        NEW
                    </div>
                )}

                {/* (LIMITED) Badge */}
                {isLimited && (
                    <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-lg border text-[10px] font-black text-white uppercase tracking-widest shadow-lg flex flex-col items-center gap-0.5 ${
                        (currentDownloads || 0) >= (maxDownloads || 0) 
                        ? 'bg-red-600 border-red-400 shadow-red-600/30' 
                        : 'bg-orange-600 border-orange-400 shadow-orange-600/30'
                    }`}>
                        <span>Limited</span>
                        <span className="text-[8px] opacity-80">
                            {(currentDownloads || 0) >= (maxDownloads || 0) 
                                ? 'SOLD OUT' 
                                : `${(maxDownloads || 0) - (currentDownloads || 0)} / ${maxDownloads} Left`}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                {/* Tags */}
                <div className="flex gap-2 mb-3 flex-wrap">
                    {tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-semibold text-violet-300 uppercase tracking-wider backdrop-blur-md">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-violet-300 transition-colors w-[65%]">
                        {title}
                    </h3>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {(likesCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 backdrop-blur-md">
                                <Heart size={10} className="fill-pink-500/50" />
                                <span className="text-[10px] font-bold">{likesCount}</span>
                            </div>
                        )}
                        {(averageRating ?? 0) > 0 && (
                            <div className="flex items-center gap-1" title={`${totalReviews || 0} Reviews`}>
                                <StarRating rating={averageRating!} readOnly size={10} />
                                <span className="text-[10px] font-bold text-yellow-500">{Number(averageRating).toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                        {authorPicture ? (
                            <img src={authorPicture} alt={author || "Unknown"} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white uppercase">{(author || "NA").substring(0, 2)}</span>
                            </div>
                        )}
                        <div className="flex items-center">
                            <p className="text-sm text-gray-400 font-medium line-clamp-1 break-all">
                                By {ownerUsername ? (
                                    <Link 
                                        href={`/profile/${ownerUsername}`} 
                                        className="hover:text-violet-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {author || "Unknown"}
                                    </Link>
                                ) : (
                                    <span className="text-gray-400">{author || "Unknown"}</span>
                                )}
                            </p>
                            {authorVerified && (
                                <svg className="w-3.5 h-3.5 text-blue-400 ml-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.6l-4.2-4.2 1.4-1.4 2.8 2.8 6.4-6.4 1.4 1.4-7.8 7.8z"/>
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-white backdrop-blur-md group-hover:bg-violet-600 group-hover:border-violet-400 transition-colors whitespace-nowrap ml-2">
                        {price === 0 || price === "Free" ? "Free" : `${price} R$`}
                    </div>
                </div>
            </div>

            {/* Border glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-violet-500/50 transition-colors duration-500 pointer-events-none" />
        </div>
    );
}
