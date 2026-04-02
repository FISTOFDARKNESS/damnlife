import { NextRequest, NextResponse } from "next/server";
import { getUsernameRegistry, getUserProfile, saveUserProfile, reportItem } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    try {
        const { username } = await params;
        const { adminEmail, banned, reason, type, expiresAt } = await req.json();

        if (adminEmail !== "kaioadrik08@gmail.com") {
            return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
        }

        const registry = await getUsernameRegistry();
        const targetUserId = registry[username];

        if (!targetUserId) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const targetProfile = await getUserProfile(targetUserId);
        if (!targetProfile) {
            return NextResponse.json({ error: "Profile missing data." }, { status: 404 });
        }

        // Apply Ban logic
        if (banned) {
            if (!reason || !type) {
                return NextResponse.json({ error: "Must provide reason and type for banning." }, { status: 400 });
            }
            targetProfile.banned = {
                isBanned: true,
                reason,
                type,
                expiresAt: type === "temp" ? expiresAt : undefined
            };

            await reportItem({
                type: "ban",
                targetId: targetUserId,
                targetUsername: username,
                reporterEmail: "system",
                reason: `Admin applied ${type} ban. Reason: ${reason}`
            });
        } else {
            // Unban logic
            targetProfile.banned = { isBanned: false, reason: "", type: "temp" };
            delete targetProfile.banned; // clean it up
            
            await reportItem({
                type: "unban",
                targetId: targetUserId,
                targetUsername: username,
                reporterEmail: "system",
                reason: `Admin removed the ban.`
            });
        }

        await saveUserProfile(targetUserId, targetProfile);

        return NextResponse.json({ success: true, banned: !!banned, profile: targetProfile });
    } catch (error: any) {
        console.error("Ban API Error:", error);
        return NextResponse.json({ error: "Failed to apply ban status.", details: error.message }, { status: 500 });
    }
}
