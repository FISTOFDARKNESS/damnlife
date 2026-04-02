import { NextRequest, NextResponse } from "next/server";
import { removeReport, deleteComment, deleteAsset } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { action, adminEmail, targetType, targetId, assetId } = await req.json();

        if (adminEmail !== "kaioadrik08@gmail.com") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (action === "delete_content") {
            if (targetType === "comment") {
                // targetId is commentId, assetId is the asset
                await deleteComment(assetId, targetId);
            } else if (targetType === "asset") {
                // targetId is assetId
                await deleteAsset(targetId, "Deleted by moderation");
            }
        }

        // Always remove the report when resolved (dismiss or delete_content)
        await removeReport(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Resolve Report Error:", error);
        return NextResponse.json({ error: "Failed to resolve report", details: error.message }, { status: 500 });
    }
}
