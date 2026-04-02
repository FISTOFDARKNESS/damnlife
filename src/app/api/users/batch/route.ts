import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, getAllAssets } from "@/lib/github";

export async function POST(req: NextRequest) {
    try {
        const { userIds } = await req.json();

        if (!Array.isArray(userIds)) {
            return NextResponse.json({ error: "userIds must be an array" }, { status: 400 });
        }

        // Fetch all assets once to calculate asset counts efficiently
        const allAssets = await getAllAssets();
        
        // Parallel fetch for all user profiles
        const profiles = await Promise.all(userIds.map(async (id) => {
            const profile = await getUserProfile(id);
            if (!profile) return null;

            // Calculate published assets count for this user
            const publishedAssets = allAssets.filter(
                (a: any) => a.ownerId === id && a.status === "approved"
            );

            return {
                id: profile.id,
                username: profile.username || profile.id,
                name: profile.name || "Unknown User",
                picture: profile.picture || "",
                verified: profile.verified || false,
                followersCount: profile.followers?.length || 0,
                followingCount: profile.following?.length || 0,
                assetCount: publishedAssets.length,
            };
        }));

        // Filter out any nulls in case a user profile didn't exist
        const validProfiles = profiles.filter(p => p !== null);

        return NextResponse.json({ success: true, users: validProfiles });

    } catch (error: any) {
        console.error("Batch Users API Error:", error);
        return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
    }
}
