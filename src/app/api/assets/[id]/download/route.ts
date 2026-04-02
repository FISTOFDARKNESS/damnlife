import { NextRequest, NextResponse } from "next/server";
import { getAssetById, updateAssetMetadata, addNotification, checkAndIncrementUsage, getDownloadRegistry, addToDownloadRegistry } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const asset = await getAssetById(id);

        if (!asset) {
            return NextResponse.json({ error: "Asset not found." }, { status: 404 });
        }

        const { userId } = await req.json();
        // Get User IP for Limited Enforcement
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

        // Check if asset is limited and if limit reached
        if (asset.isLimited) {
            const max = asset.maxDownloads || 0;
            const current = asset.downloads || 0;

            if (current >= max) {
                return NextResponse.json({ error: "Limit reached. This asset is no longer available." }, { status: 410 });
            }

            // Check if this IP already downloaded
            const registry = await getDownloadRegistry(id);
            if (registry.includes(ip)) {
                return NextResponse.json({ error: "Multiple downloads prohibited. You have already downloaded this limited asset." }, { status: 403 });
            }
        }

        // Check Hourly Rate Limit (for generic abuse prevention)
        const usageCheck = await checkAndIncrementUsage(userId, 'download');
        if (!usageCheck.success) {
            return NextResponse.json({ 
                error: "Rate limit exceeded", 
                details: usageCheck.error,
                limit: usageCheck.limit,
                isVerified: usageCheck.isVerified
            }, { status: 429 });
        }

        const currentDownloads = asset.downloads || 0;
        const updatedMetadata = {
            ...asset,
            downloads: currentDownloads + 1,
        };
        delete updatedMetadata.comments;

        await updateAssetMetadata(id, updatedMetadata, `Track download for asset ${id}`);

        // If limited, record the IP to prevent resubmission
        if (asset.isLimited) {
            await addToDownloadRegistry(id, ip);
        }

        if (asset.ownerId) {
            await addNotification(asset.ownerId, {
                type: "download",
                title: "Asset Downloaded",
                message: `Someone downloaded your asset "${asset.title}"!`,
                link: `/asset/${id}`
            }).catch(e => console.error("Notification trigger failed", e));
        }

        return NextResponse.json({ success: true, downloads: currentDownloads + 1 });
    } catch (error: any) {
        console.error("Download tracking error:", error);
        return NextResponse.json({ error: "Failed to track download." }, { status: 500 });
    }
}
