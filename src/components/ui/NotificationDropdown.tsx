"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import Link from "next/link";
import { Download, MessageSquare, CornerUpLeft } from "lucide-react";

export function NotificationDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark as read immediately on UI
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            // Fire API to update backend
            await fetch('/api/notifications/mark-read', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.id })
            });
        }
    };

    if (!user) return null;

    return (
        <div className="relative mr-2" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-bg animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 glass-panel border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-surface/50">
                        <h3 className="font-bold text-white">Notifications</h3>
                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-md">{notifications.length} Total</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-dark-bg/90">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notif => (
                                    <Link
                                        href={notif.link || "#"}
                                        key={notif.id}
                                        onClick={() => setIsOpen(false)}
                                        className={`block p-4 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-violet-900/20' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 text-violet-400">
                                                {notif.type === 'download' && <Download size={20} />}
                                                {notif.type === 'comment' && <MessageSquare size={20} />}
                                                {notif.type === 'reply' && <CornerUpLeft size={20} />}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm ${!notif.read ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                <span className="text-[10px] text-gray-600 mt-2 block font-semibold uppercase tracking-wider">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
