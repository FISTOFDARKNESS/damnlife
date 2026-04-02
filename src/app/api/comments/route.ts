import { NextRequest, NextResponse } from "next/server";
import { getFileContent, uploadFile, getAssetById, addNotification, getUserProfile, reportItem } from "@/lib/github";
import { containsBadWord } from "@/lib/profanity";

export async function POST(req: NextRequest) {
    try {
        const { assetId, author, authorId, replyToId, text, ignoreProfanity } = await req.json();

        if (!assetId || !author || !authorId || !text) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const badWord = containsBadWord(text);
        if (badWord && !ignoreProfanity) {
            return NextResponse.json({ error: "Profanity detected", badWord }, { status: 400 });
        }

        const commentPath = `Marketplace/Asset/${assetId}/comments.json`;
        let existingComments = [];

        // Try to fetch existing comments
        try {
            const commentsStr = await getFileContent(commentPath);
            if (commentsStr) {
                existingComments = JSON.parse(commentsStr);
            }
        } catch (err) {
            // File might not exist yet, ignore
        }

        let isVerified = false;
        let authorPicture = undefined;
        try {
            const profile = await getUserProfile(authorId);
            if (profile) {
                isVerified = profile.verified || false;
                authorPicture = profile.picture;
            }
        } catch (e) {
            console.error("Failed to fetch author profile for verification badge:", e);
        }

        const newComment = {
            id: Date.now().toString(),
            author,
            authorId,
            authorPicture,
            isVerified,
            replyToId: replyToId || null,
            text,
            timestamp: new Date().toISOString()
        };

        existingComments.push(newComment);

        const contentBase64 = Buffer.from(JSON.stringify(existingComments, null, 2)).toString('base64');
        await uploadFile(commentPath, contentBase64, `Comment created on asset ${assetId}`);

        const asset = await getAssetById(assetId);
        if (asset && asset.ownerId) {
            if (badWord && ignoreProfanity) {
                // Report to admin
                reportItem({
                    type: "profanity",
                    targetId: newComment.id,
                    assetId: assetId,
                    reporterEmail: "system",
                    reason: `User ignored warning for blocked word: "${badWord}" in comment.`
                }).catch(e => console.error("Report failed", e));

                // Notify owner if enabled
                const ownerProfile = await getUserProfile(asset.ownerId);
                if (ownerProfile?.notifyBadWords) {
                    await addNotification(asset.ownerId, {
                        type: "warning",
                        title: "Profanity Alert",
                        message: `${author} posted a comment containing blocked words on your asset "${asset.title}".`,
                        link: `/asset/${assetId}`
                    }).catch(e => console.error(e));
                }
            }

            await addNotification(asset.ownerId, {
                type: "comment",
                title: "New Comment",
                message: `${author} commented on your asset "${asset.title}".`,
                link: `/asset/${assetId}`
            }).catch(e => console.error("Notification trigger failed", e));
        }

        return NextResponse.json({ success: true, comment: newComment });
    } catch (error: any) {
        console.error("Comments API Error:", error);
        return NextResponse.json({ error: "Failed to post comment.", details: error.message }, { status: 500 });
    }
}
