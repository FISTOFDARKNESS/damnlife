"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, Package, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ModalUser {
    id: string;
    username: string;
    name: string;
    picture: string;
    verified: boolean;
    followersCount: number;
    followingCount: number;
    assetCount: number;
}

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    userIds: string[];
}

export function FollowListModal({ isOpen, onClose, title, userIds }: FollowListModalProps) {
    const [users, setUsers] = useState<ModalUser[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isOpen) {
            setUsers([]);
            return;
        }

        if (userIds.length === 0) {
            setUsers([]);
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/users/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userIds })
                });

                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch user list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isOpen, userIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-dark-bg/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="text-sm font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                            {userIds.length}
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-10">
                            <div className="w-8 h-8 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-10 text-gray-400">
                            <p>No users found.</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <div 
                                key={user.id} 
                                onClick={() => {
                                    onClose();
                                    router.push(`/profile/${user.username}`);
                                }}
                                className="group flex items-center p-4 rounded-xl bg-dark-surface border border-white/5 hover:border-violet-500/50 hover:bg-white/5 cursor-pointer transition-all"
                            >
                                <div className="flex-shrink-0 relative">
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.name} className="w-14 h-14 rounded-full object-cover border border-white/10 group-hover:border-violet-500/50 transition-colors" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-lg">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    {user.verified && (
                                        <div className="absolute -bottom-1 -right-1 bg-dark-bg rounded-full">
                                            <CheckCircle size={16} className="text-blue-400 fill-blue-400/20" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="ml-4 flex-1 overflow-hidden">
                                    <h3 className="text-white font-bold truncate flex items-center gap-1 text-base">
                                        {user.name}
                                    </h3>
                                    <p className="text-gray-400 text-xs truncate mb-2">@{user.username}</p>
                                    
                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-1" title="Published Assets">
                                            <Package size={12} className="text-gray-400" />
                                            <span>{user.assetCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Followers">
                                            <Users size={12} className="text-gray-400" />
                                            <span>{user.followersCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Following">
                                            <UserPlus size={12} className="text-gray-400" />
                                            <span>{user.followingCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
