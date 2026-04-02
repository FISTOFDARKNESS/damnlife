"use client";

import { HeroScene } from "@/components/ui/HeroScene";
import { AssetCard } from "@/components/ui/AssetCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { AssetModal, AssetData } from "@/components/ui/AssetModal";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from "@/components/providers/SettingsProvider";

export default function Home() {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "most_liked" | "highest_rated">("newest");
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        if (data.success) {
          // Sort by newest first by default
          setAssets(data.assets.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        }
      } catch (error) {
        console.error("Failed to load assets", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  return (
    <div className="relative min-h-screen">
      {settings.nextGenEffects && <HeroScene />}

      {/* Hero Content Overlay */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 mt-16 md:mt-24">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-600">
            Next-Gen
          </span>
          <br className="md:hidden" /> Roblox Assets
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Experience the future of Roblox development. <br />
          Discover premium assets curated by the community and secured by our <span className="text-white font-medium">Excalibur Uplink</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto">
          {/* Main Call to Action */}
          <button className="flex-1 neon-button py-4 rounded-xl text-white font-semibold tracking-wide text-lg shadow-lg relative overflow-hidden group">
            <span className="relative z-10">Explore Marketplace</span>
            {/* Hover flare effect */}
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>

          <Link href="/uplink" className="flex-1 glass py-4 rounded-xl text-gray-300 font-medium hover:text-white hover:bg-white/5 transition-all text-lg text-center flex items-center justify-center">
            Upload Asset
          </Link>
        </div>
      </section>

      {/* Asset Browser section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20 border-t border-white/5 bg-dark-bg/80 backdrop-blur-md pb-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="w-full md:w-1/3">
            <h2 className="text-3xl font-bold mb-2">Trending Assets</h2>
            <p className="text-gray-400">Discover what top developers are using.</p>
          </div>
          <div className="w-full md:w-2/3 flex gap-4">
            <div className="flex-1">
                <SearchBar />
            </div>
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-dark-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
            >
                <option value="newest">Latest Uploads</option>
                <option value="most_liked">Most Liked</option>
                <option value="highest_rated">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Grid for Asset Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-32 w-full">
            <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center text-gray-500 col-span-full py-12">No assets published yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...assets].sort((a, b) => {
              if (sortBy === "most_liked") return (b.likesCount || 0) - (a.likesCount || 0);
              if (sortBy === "highest_rated") return (b.averageRating || 0) - (a.averageRating || 0);
              // default (newest)
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }).map((asset) => (
              <AssetCard
                key={asset.id}
                id={asset.id}
                title={asset.title}
                author={asset.author}
                authorPicture={asset.authorPicture}
                price={asset.price}
                thumbnailUrl={asset.thumbnailUrl}
                tags={asset.tags}
                likesCount={asset.likesCount}
                averageRating={asset.averageRating}
                totalReviews={asset.totalReviews}
                createdAt={asset.createdAt}
                ownerId={asset.ownerId}
                ownerUsername={asset.ownerUsername}
                isLimited={asset.isLimited}
                maxDownloads={asset.maxDownloads}
                currentDownloads={asset.downloads}
                onClick={() => router.push(`/asset/${asset.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
