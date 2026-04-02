"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGoogleLogin } from "@react-oauth/google";

interface DownloadButtonProps {
    assetId: string;
    fileUrl: string;
}

export function DownloadButton({ assetId, fileUrl }: DownloadButtonProps) {
    const { user, login } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);

    const signIn = useGoogleLogin({
        onSuccess: (codeResponse) => login(codeResponse),
        onError: () => console.error("Login Failed"),
    });

    const allowedExtensions = ["rbxm", "rbxl", "rbxmx"];

    const handleDownload = async () => {
        if (!user) {
            signIn();
            return;
        }

        const parsedUrl = new URL(fileUrl, window.location.origin);
        
        let extension = parsedUrl.searchParams.get("ext")?.replace(".", "")?.toLowerCase();
        if (!extension) {
            const actualUrl = parsedUrl.searchParams.get("url") || fileUrl;
            extension = actualUrl.split(".").pop()?.toLowerCase();
        }

        // Validate extension
        if (!extension || !allowedExtensions.includes(extension)) {
            alert("Invalid file type. Only .rbxm, .rbxl, and .rbxmx are allowed.");
            return;
        }

        setIsDownloading(true);

        try {
            const res = await fetch(`/api/assets/${assetId}/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    alert(data.details || "Hourly download limit reached.");
                    return;
                }
                if (res.status === 410) {
                    alert("This asset is no longer available. The download limit has been reached.");
                    window.location.reload(); 
                    return;
                }
                if (res.status === 403) {
                    alert("You have already downloaded this Limited Edition asset. High-value items are limited to one download per person.");
                    return;
                }
                throw new Error("Tracking failed");
            }

            const a = document.createElement("a");
            a.href = fileUrl;
            a.download = `asset_${assetId}.${extension}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error) {
            console.error("Failed to download or track asset:", error);
            alert("Download failed. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 neon-button py-4 rounded-xl text-white font-bold tracking-wide shadow-lg uppercase text-sm disabled:opacity-50"
        >
            {isDownloading ? "Starting Download..." : "Get Asset"}
        </button>
    );
}