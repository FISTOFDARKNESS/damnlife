import { NextRequest, NextResponse } from "next/server";
import { getAllAssets } from "@/lib/github";

export const revalidate = 60; // Cache the global fetch

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("q")?.toLowerCase() || "";

        if (!query) {
            return NextResponse.json({ success: true, results: [] });
        }

        let assets = await getAllAssets();
        assets = assets.filter((a: any) => a.status !== "pending" && a.status !== "rejected");

        // Filter logic: match ID, match Title (fuzzy), or match any Tag (exact or partial)
        const results = assets.filter((asset: any) => {
            const matchId = asset.id.toLowerCase().includes(query);
            const matchTitle = asset.title.toLowerCase().includes(query);
            const matchTags = asset.tags?.some((tag: string) => tag.toLowerCase().includes(query));
            const matchAuthor = asset.author?.toLowerCase().includes(query);

            return matchId || matchTitle || matchTags || matchAuthor;
        });

        // Return top 10 results
        return NextResponse.json({ success: true, results: results.slice(0, 10) });
    } catch (error: any) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Failed to perform search." }, { status: 500 });
    }
}
