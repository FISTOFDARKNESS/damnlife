"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim().length === 0) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.results);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = (assetId: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(`/asset/${assetId}`);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-sm hidden md:block ml-8">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, tag, or ID..."
                    className="w-full bg-dark-bg/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors placeholder-gray-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                </span>
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel border border-violet-500/30 rounded-xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {results.map((asset) => (
                            <button
                                key={asset.id}
                                onClick={() => handleResultClick(asset.id)}
                                className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 group"
                            >
                                <img
                                    src={asset.thumbnailUrl}
                                    alt=""
                                    className="w-12 h-12 rounded bg-dark-bg object-cover border border-white/5"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                                        {asset.title}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        by {asset.author} • {asset.tags?.slice(0, 2).join(", ")}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {isOpen && results.length === 0 && !isSearching && query.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel border border-white/10 rounded-xl p-4 text-center text-sm text-gray-400 z-50">
                    No assets found.
                </div>
            )}
        </div>
    );
}
