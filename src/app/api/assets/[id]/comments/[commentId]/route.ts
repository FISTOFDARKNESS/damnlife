import { NextRequest, NextResponse } from "next/server";
import { deleteComment, getAssetById } from "@/lib/github";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, commentId: string }> }) {
    try {
        const { id, commentId } = await params;
        const body = await req.json();
        const { email, userId } = body;

        if (!email || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const asset = await getAssetById(id);
        if (!asset) {
            if (id.startsWith('mock-')) {
                return NextResponse.json({ success: true, message: "Mock deleted" });
            }
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const isAdmin = email === "kaioadrik08@gmail.com";
        const isOwner = asset.ownerId === userId;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "Forbidden: You are not the owner or admin." }, { status: 403 });
        }

        const success = await deleteComment(id, commentId);
        
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Comment not found or failed to delete" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Delete Comment Error:", error);
        return NextResponse.json({ error: "Failed to delete comment", details: error.message }, { status: 500 });
    }
}
