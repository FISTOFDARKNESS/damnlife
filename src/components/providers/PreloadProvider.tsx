"use client";

import React, { useEffect, ReactNode } from "react";

export function PreloadProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        // Runs once on initial app load
        const preloadData = async () => {
            try {
                // 1. Fetch and Cache Global Assets
                const assetsRes = await fetch("/api/assets");
                if (assetsRes.ok) {
                    const data = await assetsRes.json();
                    if (data.assets) {
                        // Preload thumbnails silently
                        data.assets.forEach((asset: any) => {
                            if (asset.thumbnailUrl) {
                                const img = new Image();
                                img.src = asset.thumbnailUrl;
                            }
                            if (asset.authorPicture) {
                                const img = new Image();
                                img.src = asset.authorPicture;
                            }
                        });
                    }
                }

                // 2. Prewarm user cache
                fetch("/api/users/registry").catch(() => {});

            } catch (error) {
                console.error("Global Preload Error:", error);
            }
        };

        const timeoutId = setTimeout(() => {
            preloadData();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, []);

    return <>{children}</>;
}
