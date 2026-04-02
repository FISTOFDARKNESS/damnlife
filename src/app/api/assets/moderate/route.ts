import { NextRequest, NextResponse } from "next/server";
import { getAllAssets, getAssetById, updateAssetMetadata, addNotification, deleteAsset } from "@/lib/github";

export async function GET() {
    try {
        const assets = await getAllAssets();
        const pendingAssets = assets.filter((a: any) => a.status === "pending");
        return NextResponse.json({ success: true, assets: pendingAssets });
    } catch (error: any) {
        console.error("Fetch Pending Error:", error);
        return NextResponse.json({ error: "Failed to fetch pending assets." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { assetId, action, reason, adminEmail } = await req.json();

        if (adminEmail !== "kaioadrik08@gmail.com") {
            return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
        }

        const asset = await getAssetById(assetId);
        if (!asset) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }

        if (action === "approve") {
            asset.status = "approved";
        } else if (action === "reject") {
            asset.status = "rejected";
            asset.rejectionReason = reason;

            // Notify user
            if (asset.ownerId) {
                await addNotification(asset.ownerId, {
                    type: "system",
                    title: "Asset Rejected",
                    message: `Your asset "${asset.title}" was rejected by moderation.\nReason: ${reason}`,
                    link: `/uplink`
                }).catch(e => console.error(e));
            }
        }

        if (action === "approve") {
            delete asset.comments;
            await updateAssetMetadata(assetId, asset, `Moderation: ${action} for asset ${assetId}`);
        } else if (action === "reject") {
            await deleteAsset(assetId, `Moderation: Rejected (Reason: ${reason})`);
        }

        return NextResponse.json({ success: true, metadata: asset });
    } catch (error: any) {
        console.error("Moderate Action Error:", error);
        return NextResponse.json({ error: "Failed to perform moderation action." }, { status: 500 });
    }
}
