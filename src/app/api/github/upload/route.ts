import { NextRequest, NextResponse } from "next/server";
import { uploadFile, getUserProfile, reportItem, checkAndIncrementUsage } from "@/lib/github";
import { containsBadWord } from "@/lib/profanity";

export async function POST(req: NextRequest) {
    try {
        const { items, assetId, metadata, ignoreProfanity } = await req.json();

        if (!items || !assetId || !metadata) {
            return NextResponse.json({ error: "Missing required fields: items, assetId, metadata." }, { status: 400 });
        }

        // Check Rate Limit
        const usageCheck = await checkAndIncrementUsage(metadata.ownerId, 'upload');
        if (!usageCheck.success) {
            return NextResponse.json({ 
                error: "Rate limit exceeded", 
                details: usageCheck.error,
                limit: usageCheck.limit,
                isVerified: usageCheck.isVerified
            }, { status: 429 });
        }

        const badWord = containsBadWord(`${metadata.title || ''} ${metadata.description || ''}`);
        if (badWord && !ignoreProfanity) {
            return NextResponse.json({ error: "Profanity detected", badWord }, { status: 400 });
        }

        if (badWord && ignoreProfanity) {
            reportItem({
                type: "profanity",
                targetId: assetId,
                assetId: assetId,
                reporterEmail: "system",
                reason: `User ignored profanity warning on asset upload: "${badWord}"`
            }).catch(e => console.error(e));
        }

        // Step 1: Upload Thumbnail
        if (items.thumbnail) {
            const thumbPath = `Marketplace/Asset/${assetId}/thumbnail.png`;
            await uploadFile(thumbPath, items.thumbnail, `Uplink: Upload Thumbnail for ${assetId}`);
        }

        // Step 2: Upload Video Preview
        if (items.preview) {
            const vidPath = `Marketplace/Asset/${assetId}/preview.mp4`;
            await uploadFile(vidPath, items.preview, `Uplink: Upload Preview for ${assetId}`);
        }

        // Step 3: Upload Binary (RBXM, RBXL, RBXMX)
        if (items.binary) {
            const ext = metadata.extension || ".rbxm";
            const binPath = `Marketplace/Asset/${assetId}/file${ext}`;
            await uploadFile(binPath, items.binary, `Uplink: Upload Asset Binary for ${assetId}`);
        }

        // Step 4: Upload Metadata
        const userProfile = await getUserProfile(metadata.ownerId);
        if (userProfile?.verified) {
            metadata.status = "approved";
        } else {
            metadata.status = "pending";
        }
        const metaPath = `Marketplace/Asset/${assetId}/metadata.json`;
        const metaBase64 = Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64');
        await uploadFile(metaPath, metaBase64, `Uplink: Finalize Metadata for ${assetId}`);

        return NextResponse.json({ success: true, message: "Asset uploaded successfully." });
    } catch (error: any) {
        console.error("Uplink Error:", error);
        return NextResponse.json({ error: "Upload failed.", details: error.message }, { status: 500 });
    }
}
