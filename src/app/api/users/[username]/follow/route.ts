import { NextRequest, NextResponse } from "next/server";
import { toggleFollowUser, getUsernameRegistry } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    try {
        const { username } = await params; // this is the target user's username
        const { followerId } = await req.json();

        if (!followerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const registry = await getUsernameRegistry();
        const targetId = registry[username] || username; // default to username if not found in registry (might be an ID instead)

        const isFollowing = await toggleFollowUser(followerId, targetId);

        return NextResponse.json({ success: true, isFollowing });
    } catch (error: any) {
        console.error("Follow Error:", error);
        return NextResponse.json({ error: "Failed to toggle follow", details: error.message }, { status: 500 });
    }
}
