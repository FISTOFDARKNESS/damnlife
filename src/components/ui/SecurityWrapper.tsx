"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Link as LinkIcon, RefreshCw } from 'lucide-react';

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
        };

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
            }
        };

        const handleDragStart = (e: DragEvent) => {
            if ((e.target as HTMLElement).tagName.toLowerCase() === 'img') {
                e.preventDefault();
            }
        };

        // Attach global listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('dragstart', handleDragStart);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('dragstart', handleDragStart);
        };
    }, []);

    // Close menu on route change
    useEffect(() => {
        setContextMenu(null);
    }, [pathname]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setContextMenu(null);
        alert("Link copied to clipboard!");
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="select-none min-h-screen">
            {children}

            {contextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-[9999] glass-panel border border-violet-500/30 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] animate-in fade-in zoom-in duration-200"
                    style={{
                        top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 150 : contextMenu.y),
                        left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : contextMenu.x)
                    }}
                >
                    <div className="bg-dark-bg/90 backdrop-blur-md flex flex-col p-1">
                        <div className="px-3 py-2 text-xs font-bold text-violet-400 uppercase tracking-widest border-b border-white/5 mb-1 cursor-default">
                            Excalibur Store
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-violet-500/20 rounded-lg transition-colors text-left"
                        >
                            <LinkIcon size={16} /> Copy Page Link
                        </button>
                        <button
                            onClick={handleReload}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-violet-500/20 rounded-lg transition-colors text-left"
                        >
                            <RefreshCw size={16} /> Reload Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
