import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, saveUserProfile, getAssetMetadata, updateAssetMetadata } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await req.json();

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const profile = await getUserProfile(userId);
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const asset = await getAssetMetadata(id);
        if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

        profile.favorites = profile.favorites || [];
        asset.likesCount = asset.likesCount || 0;

        const isFavorited = profile.favorites.includes(id);

        if (isFavorited) {
            profile.favorites = profile.favorites.filter((fId: string) => fId !== id);
            asset.likesCount = Math.max(0, asset.likesCount - 1);
        } else {
            profile.favorites.push(id);
            asset.likesCount += 1;
        }

        // Run both updates incrementally
        await Promise.all([
            saveUserProfile(userId, profile),
            updateAssetMetadata(id, asset, `${isFavorited ? 'Removed like' : 'Added like'} on asset ${id}`)
        ]);

        return NextResponse.json({ success: true, isFavorited: !isFavorited, likesCount: asset.likesCount });
    } catch (e: any) {
        console.error("Favorite action error:", e);
        return NextResponse.json({ error: "Action failed", details: e.message }, { status: 500 });
    }
}
