import React from "react";
import { getAssetById } from "@/lib/github";
import { notFound } from "next/navigation";
import Link from "next/link";
import CommentSection from "@/components/ui/CommentSection";
import { ReviewSection } from "@/components/ui/ReviewSection";
import { AssetManager } from "@/components/ui/AssetManager";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { ReportButton } from "@/components/ui/ReportButton";
import { LikeButton } from "@/components/ui/LikeButton";
import { ArrowLeft, Package } from "lucide-react";

// Next.js App Router dynamic params
export const revalidate = 60;

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const asset = await getAssetById(id);
    const { getUserProfile } = await import('@/lib/github');

    if (!asset) {
        notFound();
    }

    let isVerified = false;
    if (asset.ownerId) {
        try {
            const profile = await getUserProfile(asset.ownerId);
            isVerified = profile?.verified || false;
        } catch (e) { }
    }

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto flex flex-col items-center">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-dark-bg -z-20 overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none"></div>
            </div>

            <div className="w-full flex justify-start mb-8">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Marketplace
                </Link>
            </div>

            {/* Asset Hero Section */}
            <div className="w-full glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-violet-500/10 border border-white/10 mb-12">
                {/* Left Side: Media Preview */}
                <div className="w-full md:w-1/2 bg-dark-bg/60 border-r border-white/5 flex items-center justify-center p-8 relative group">
                    <video
                        className="w-full rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/5 object-cover"
                        autoPlay
                        loop
                        playsInline
                        muted
                        preload="metadata"
                        poster={asset.thumbnailUrl}

                    >
                        <source
                            src={`/api/proxy/thumbnail?assetId=${asset.id}&type=preview`}
                            type="video/mp4"
                        />
                    </video>

                    {asset.thumbnailUrl && (
                        <img
                            src={asset.thumbnailUrl}
                            alt={asset.title}
                            style={{ display: "none" }}
                            className="w-full rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/5 object-cover"
                        />
                    )}

                    {!asset.thumbnailUrl && (
                        <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 flex flex-col items-center justify-center border border-white/5">
                            <Package size={96} className="mb-4 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                            <p className="text-gray-500 font-medium">Preview Unavailable</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Info & Actions */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                    <AssetManager
                        assetId={asset.id}
                        ownerId={asset.ownerId}
                        initialTitle={asset.title}
                        initialDescription={asset.description}
                    />

                    {/* Tags */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {asset.tags?.map((tag: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                        {asset.title}
                    </h1>

                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                        {asset.authorPicture ? (
                            <img src={asset.authorPicture} alt={asset.author || "User"} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-white uppercase">{(asset.author || "NA").substring(0, 2)}</span>
                            </div>
                        )}
                        <div>
                            <p className="text-gray-400 font-medium text-sm">Created by</p>
                            <div className="flex items-center gap-1">
                                {asset.ownerUsername ? (
                                    <Link 
                                        href={`/profile/${asset.ownerUsername}`} 
                                        className="text-white hover:text-violet-400 transition-colors font-bold"
                                    >
                                        {asset.author || "Unknown"}
                                    </Link>
                                ) : (
                                    <span className="text-white font-bold">{asset.author || "Unknown"}</span>
                                )}
                                {isVerified && (
                                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.6l-4.2-4.2 1.4-1.4 2.8 2.8 6.4-6.4 1.4 1.4-7.8 7.8z"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Description</h3>
                        <p className="text-gray-400 leading-relaxed">
                            {asset.description || "This high-quality asset is currently missing a detailed description. However, you can expect top-tier performance for your experiences."}
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Asset ID</p>
                                <p className="text-sm font-mono text-white truncate" title={asset.id}>{asset.id.slice(0, 8)}...</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Downloads</p>
                                <p className="text-xl font-bold text-white">
                                    {asset.downloads || 0}
                                    {asset.isLimited && (
                                        <span className="text-sm text-gray-500 ml-2">/ {asset.maxDownloads}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {asset.isLimited && (
                            <div className="mt-8">
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
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-6">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-semibold uppercase">Price</span>
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                {asset.price === 0 || asset.price === "Free" ? "Free" : `${asset.price} R$`}
                            </span>
                        </div>

                        <div className="flex gap-4 items-center">
                            <LikeButton assetId={asset.id} initialLikesCount={asset.likesCount || 0} />
                            <ReportButton type="asset" targetId={asset.id} assetId={asset.id} />
                            <DownloadButton
                                assetId={asset.id}
                                fileUrl={`/api/proxy/thumbnail?assetId=${asset.id}&type=file&ext=${encodeURIComponent(asset.extension || '.rbxm')}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lower Content Grid */}
            <div className="flex flex-col lg:flex-row gap-8 w-full mt-8">
                {/* Left side: Comments */}
                <div className="w-full lg:w-1/2">
                    <CommentSection assetId={asset.id} ownerId={asset.ownerId} initialComments={asset.comments || []} />
                </div>
                {/* Right side: Reviews */}
                <div className="w-full lg:w-1/2">
                    <ReviewSection assetId={asset.id} ownerId={asset.ownerId} />
                </div>
            </div>
        </div>
    );
}
