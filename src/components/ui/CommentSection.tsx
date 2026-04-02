"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGoogleLogin } from "@react-oauth/google";
import { MessageSquare, CornerUpLeft, Trash2, Flag } from "lucide-react";
import { ProfanityModal } from "./ProfanityModal";

interface Comment {
    id: string;
    author: string;
    authorId?: string;
    authorPicture?: string;
    isVerified?: boolean;
    replyToId?: string;
    text: string;
    timestamp: string;
}

interface CommentSectionProps {
    assetId: string;
    ownerId?: string;
    initialComments: Comment[];
}

export default function CommentSection({ assetId, ownerId, initialComments }: CommentSectionProps) {
    const { user, login } = useAuth();
    const signIn = useGoogleLogin({
        onSuccess: (codeResponse) => login(codeResponse),
        onError: () => console.error("Login Failed"),
    });
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    const [showProfanityModal, setShowProfanityModal] = useState(false);
    const [badWord, setBadWord] = useState("");

    const handleSubmit = async (e?: React.FormEvent, ignoreProfanity = false) => {
        if (e) e.preventDefault();
        if (!user || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assetId,
                    author: user.name,
                    authorId: user.id,
                    replyToId: replyingTo,
                    text: newComment.trim(),
                    ignoreProfanity
                }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                if (data.error === "Profanity detected") {
                    setBadWord(data.badWord);
                    setShowProfanityModal(true);
                    return;
                }
                throw new Error("Failed to post comment");
            }

            setComments([...comments, data.comment]);
            setNewComment("");
            setReplyingTo(null);
        } catch (error) {
            console.error("Comment Error:", error);
            alert("Failed to submit comment. If in mock mode without API keys, this is expected.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this comment?")) return;
        
        try {
            const res = await fetch(`/api/assets/${assetId}/comments/${commentId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, userId: user.id })
            });
            
            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
                if (replyingTo === commentId) setReplyingTo(null);
            } else {
                alert("Failed to delete comment");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleReport = async () => {
        if (!user || !reportingCommentId || !reportReason.trim()) return;
        
        setIsReporting(true);
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "comment",
                    targetId: reportingCommentId,
                    assetId: assetId,
                    reason: reportReason,
                    reporterEmail: user.email,
                    extraData: { text: comments.find(c => c.id === reportingCommentId)?.text }
                })
            });
            
            if (res.ok) {
                alert("Comment reported successfully.");
                setReportModalOpen(false);
                setReportReason("");
                setReportingCommentId(null);
            } else {
                alert("Failed to report comment.");
            }
        } catch (error) {
            console.error("Report error:", error);
        } finally {
            setIsReporting(false);
        }
    };

    const replyTarget = replyingTo ? comments.find(c => c.id === replyingTo) : null;

    return (
        <div className="w-full mt-12 bg-dark-bg/80 border border-white/5 rounded-3xl p-6 md:p-10 mb-20 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare size={24} className="text-violet-400" /> Comments ({comments.length})
            </h2>

            {/* Comment Form */}
            <div className="mb-10 p-6 glass-panel rounded-2xl flex flex-col gap-4">
                {replyTarget && (
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Replying to</span>
                            <span className="font-bold text-violet-400">@{replyTarget.author}</span>
                            <span className="truncate max-w-[200px] text-xs">"{replyTarget.text}"</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-red-400 hover:text-red-300 transition-colors text-xl leading-none">&times;</button>
                    </div>
                )}
                <div className="flex gap-4 w-full">
                    {user ? (
                        <>
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-white/10" />
                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-end gap-3">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={`Comment as ${user.name}...`}
                                    className="w-full bg-dark-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 resize-none h-24"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newComment.trim()}
                                    className="neon-button py-2 px-6 rounded-xl font-bold text-white shadow-lg text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? "Posting..." : "Post Comment"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="w-full flex flex-col text-center py-8 items-center justify-center border border-white/10 rounded-xl bg-dark-bg/50">
                            <p className="text-gray-400 mb-4 font-medium">You must be signed in to leave a comment.</p>
                            <button
                                onClick={() => signIn()}
                                className="px-6 py-2 rounded-lg text-sm font-bold text-white neon-button shadow-lg"
                            >
                                Connect Identity to Comment
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comment List */}
            <div className="space-y-2">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center italic mt-6">No comments yet. Be the first to start the discussion!</p>
                ) : (
                    comments.map((comment) => {
                        const parentComment = comment.replyToId ? comments.find(c => c.id === comment.replyToId) : null;
                        return (
                            <div key={comment.id} className="relative flex flex-col p-4 rounded-xl hover:bg-white/5 transition-colors group">
                                
                                {/* Discord style Reply Link */}
                                {parentComment && (
                                    <div className="flex items-center gap-2 mb-1 ml-[1.125rem] text-xs text-gray-400 md:ml-[1.125rem]">
                                        <div className="w-6 h-4 border-l-2 border-t-2 border-gray-600 rounded-tl-lg mt-3 mr-1" />
                                        {parentComment.authorPicture ? (
                                            <img src={parentComment.authorPicture} alt="Avatar" className="w-[18px] h-[18px] rounded-full object-cover" />
                                        ) : (
                                            <div className="w-[18px] h-[18px] rounded-full bg-gray-700 flex items-center justify-center text-[8px] text-white">
                                                {parentComment.author.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-semibold cursor-pointer hover:underline text-gray-300">
                                            @{parentComment.author}
                                        </span>
                                        <span className="truncate max-w-[150px] sm:max-w-sm ml-1">{parentComment.text}</span>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    {comment.authorPicture ? (
                                        <img src={comment.authorPicture} alt={comment.author} className="w-10 h-10 rounded-full shrink-0 border border-white/10 object-cover mt-1" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white shrink-0 mt-1">
                                            {comment.author.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-200">{comment.author}</span>
                                            {comment.isVerified && (
                                                <svg className="w-4 h-4 text-blue-400 -ml-1" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.6l-4.2-4.2 1.4-1.4 2.8 2.8 6.4-6.4 1.4 1.4-7.8 7.8z"/>
                                                </svg>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 self-start absolute top-4 right-4 bg-dark-surface/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                                        {user && (
                                            <button 
                                                onClick={() => setReplyingTo(comment.id)} 
                                                className="p-1 px-2 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                                                title="Reply"
                                            >
                                                <CornerUpLeft size={16} />
                                            </button>
                                        )}
                                        {user && (user.email === "kaioadrik08@gmail.com" || user.id === ownerId) && (
                                            <button 
                                                onClick={() => handleDelete(comment.id)} 
                                                className="p-1 px-2 text-red-500 hover:text-red-400 transition-colors flex items-center justify-center"
                                                title="Delete Comment"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        {user && (
                                            <button 
                                                onClick={() => { setReportingCommentId(comment.id); setReportModalOpen(true); }}
                                                className="p-1 px-2 text-yellow-500 hover:text-yellow-400 transition-colors flex items-center justify-center"
                                                title="Report Comment"
                                            >
                                                <Flag size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Report Modal */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Report Comment</h3>
                        <p className="text-sm text-gray-400 mb-4">Please provide a reason for reporting this comment. This will go to the moderation queue.</p>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Reason for report..."
                            className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none mb-4 h-24 resize-none"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setReportModalOpen(false); setReportReason(""); }}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={isReporting || !reportReason.trim()}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                            >
                                {isReporting ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
    );
}
