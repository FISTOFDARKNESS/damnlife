import { NextRequest, NextResponse } from "next/server";
import { getAssetById, deleteAsset, updateAssetMetadata, reportItem } from "@/lib/github";
import { containsBadWord } from "@/lib/profanity";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { ownerId, email } = await req.json();
        const asset = await getAssetById(id);

        if (!asset) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }

        const isAdmin = email === "kaioadrik08@gmail.com";
        if (asset.ownerId !== ownerId && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized. You are not the owner of this asset." }, { status: 403 });
        }

        // Proceed to delete
        await deleteAsset(id, `Delete asset ${id} by owner request`);

        return NextResponse.json({ success: true, message: "Asset deleted successfully." });
    } catch (error: any) {
        console.error("Delete API Error:", error);
        return NextResponse.json({ error: "Failed to delete asset.", details: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { ownerId, email, title, description, ignoreProfanity } = await req.json();

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
        }

        const asset = await getAssetById(id);

        if (!asset) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }

        const isAdmin = email === "kaioadrik08@gmail.com";
        if (asset.ownerId !== ownerId && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized. You are not the owner of this asset." }, { status: 403 });
        }

        // Update the metadata
        const badWord = containsBadWord(`${title} ${description}`);
        if (badWord && !ignoreProfanity) {
            return NextResponse.json({ error: "Profanity detected", badWord }, { status: 400 });
        }

        if (badWord && ignoreProfanity) {
            reportItem({
                type: "profanity",
                targetId: id,
                assetId: id,
                reporterEmail: "system",
                reason: `User ignored profanity warning on asset edit: "${badWord}"`
            }).catch(e => console.error(e));
        }
        const updatedMetadata = {
            ...asset,
            title,
            description,
            // Keep original comments structure independent from the base metadata payload 
            // by removing the implicitly joined comments list from getAssetById
        };
        delete updatedMetadata.comments;

        await updateAssetMetadata(id, updatedMetadata, `Update metadata for asset ${id}`);

        return NextResponse.json({ success: true, metadata: updatedMetadata });
    } catch (error: any) {
        console.error("Update API Error:", error);
        return NextResponse.json({ error: "Failed to update asset.", details: error.message }, { status: 500 });
    }
}
