"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { StarRating } from "@/components/ui/StarRating";
import Link from "next/link";
import { ProfanityModal } from "@/components/ui/ProfanityModal";

export function ReviewSection({ assetId, ownerId }: { assetId: string, ownerId: string }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Profanity modal state
    const [showProfanityWarning, setShowProfanityWarning] = useState(false);
    const [flaggedWords, setFlaggedWords] = useState<string[]>([]);

    useEffect(() => {
        fetch(`/api/assets/${assetId}/reviews`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setReviews(data.reviews || []);
                }
            })
            .catch(e => console.error("Failed to load reviews", e))
            .finally(() => setLoading(false));
    }, [assetId]);

    const submitReview = async (ignoreProfanity: boolean = false) => {
        if (!user || rating === 0) return;
        setIsSubmitting(true);

        try {
            const payload = { userId: user.id, rating, comment, ignoreWarning: ignoreProfanity, ownerId };
            
            // Reusing existing bad words check logic by sending it directly to submission
            // Wait, we can check it client side if we import the utility, but let's just use the server if we had one.
            // Since we built the logic into the component locally, we will just send it.
            
            const res = await fetch(`/api/assets/${assetId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.flaggedWords) {
                setFlaggedWords(data.flaggedWords);
                setShowProfanityWarning(true);
                setIsSubmitting(false);
                return;
            }

            if (data.success) {
                setReviews(data.reviews);
                setComment("");
                setRating(0);
                setShowProfanityWarning(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasReviewed = reviews.some(r => r.userId === user?.id);

    return (
        <div className="w-full mt-12 mb-12">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    User Reviews <span className="text-sm font-medium text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{reviews.length}</span>
                </h3>
            </div>

            {/* Submission Form */}
            {user ? (
                <div className="glass-panel p-6 rounded-2xl border border-white/5 mb-8 bg-dark-surface/50">
                    <h4 className="font-semibold text-white mb-4">
                        {hasReviewed ? "Update your review" : "Leave a review"}
                    </h4>
                    
                    <div className="mb-4 flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Select Rating:</span>
                        <StarRating rating={rating} onChange={setRating} size={28} />
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience using this asset (optional)..."
                        className="w-full bg-dark-bg/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 transition-colors mb-4 md:h-24 resize-none"
                    />

                    <div className="flex justify-end">
                        <button
                            onClick={() => submitReview(false)}
                            disabled={isSubmitting || rating === 0}
                            className={`neon-button px-6 py-2.5 rounded-xl font-bold text-white transition-all ${isSubmitting || rating === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? "Publishing..." : (hasReviewed ? "Update Review" : "Publish Review")}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-6 rounded-2xl border border-white/5 mb-8 text-center flex flex-col items-center justify-center">
                    <p className="text-gray-400 mb-4">You must be logged in to leave a review.</p>
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center p-8 border border-white/5 rounded-2xl bg-white/5">
                    <p className="text-gray-500">No reviews yet. Be the first to rate this asset!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review: any) => (
                        <div key={review.id} className="p-5 rounded-2xl glass-panel border border-white/5 flex gap-4">
                            <Link href={`/profile/${review.authorUsername || review.authorName.split(" ")[0]}`}>
                                {review.authorPicture ? (
                                    <img src={review.authorPicture} alt="User" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                        {(review.authorName || "U").substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </Link>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <Link href={`/profile/${review.authorUsername || review.authorName.split(" ")[0]}`}>
                                        <h4 className="font-bold text-white hover:text-violet-400 transition-colors">{review.authorName}</h4>
                                    </Link>
                                    <span className="text-xs text-gray-500">{new Date(review.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="mb-2">
                                    <StarRating rating={review.rating} readOnly size={14} />
                                </div>
                                {review.comment && (
                                    <p className="text-sm text-gray-300 leading-relaxed mt-2">{review.comment}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProfanityModal 
                isOpen={showProfanityWarning}
                badWord={flaggedWords[0] || "unknown"}
                onCancel={() => setShowProfanityWarning(false)}
                onConfirm={() => submitReview(true)}
            />
        </div>
    );
}
