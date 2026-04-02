"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface LikeButtonProps {
    assetId: string;
    initialLikesCount: number;
    className?: string;
}

export function LikeButton({ assetId, initialLikesCount, className = "" }: LikeButtonProps) {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(user?.favorites?.includes(assetId) || false);
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [likeLoading, setLikeLoading] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent closing modal if used inside one
        if (!user || likeLoading) return;
        setLikeLoading(true);
        try {
            const res = await fetch(`/api/assets/${assetId}/favorite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await res.json();
            if (data.success) {
                setIsLiked(data.isFavorited);
                setLikesCount(data.likesCount);
                if (user) {
                    user.favorites = data.isFavorited 
                        ? [...(user.favorites || []), assetId] 
                        : (user.favorites || []).filter(id => id !== assetId);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLikeLoading(false);
        }
    };

    return (
        <button 
            onClick={handleLike}
            disabled={!user || likeLoading}
            title={!user ? "Sign in to like" : isLiked ? "Unlike" : "Like"}
            className={`h-12 px-5 flex items-center gap-2 rounded-xl border font-bold transition-all duration-200 disabled:cursor-not-allowed ${className}
                ${isLiked 
                    ? "bg-pink-500/20 border-pink-500/60 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]" 
                    : "bg-white/5 border-white/20 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/40 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)]"
                }`}
        >
            <Heart 
                size={20} 
                className={`transition-all duration-200 ${isLiked ? "fill-pink-500 stroke-pink-400 scale-110" : "fill-none stroke-pink-400"}`} 
            />
            <span className="text-sm font-bold">{likesCount}</span>
        </button>
    );
}
