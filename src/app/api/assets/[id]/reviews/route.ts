import { NextRequest, NextResponse } from "next/server";
import { getFileContent, uploadFile, getAssetMetadata, getUserProfile } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId, rating, comment } = await req.json();

        if (!userId || typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
        }

        const profile = await getUserProfile(userId);
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const asset = await getAssetMetadata(id);
        if (!asset) return NextResponse.json({ error: "Asset metadata not found" }, { status: 404 });

        // Fetch existing reviews
        const reviewsPath = `Marketplace/Asset/${id}/reviews.json`;
        let reviews = [];
        try {
            const dataStr = await getFileContent(reviewsPath);
            if (dataStr) reviews = JSON.parse(dataStr);
        } catch (e) {
            // file doesn't exist yet, we'll create it
        }

        // Check if user already reviewed
        const existingIndex = reviews.findIndex((r: any) => r.userId === userId);
        const newReview = {
            id: `rev_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            userId,
            authorName: profile.name,
            authorUsername: profile.username || profile.name.split(" ")[0],
            authorPicture: profile.picture,
            rating,
            comment: comment || "",
            timestamp: new Date().toISOString()
        };

        if (existingIndex !== -1) {
            reviews[existingIndex] = newReview; // update
        } else {
            reviews.unshift(newReview); // prepend new
        }

        // Calculate new aggregates
        const totalReviews = reviews.length;
        const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        const averageRating = parseFloat((sum / totalReviews).toFixed(1));

        // Update core asset metadata for the Explore feed overrides
        asset.totalReviews = totalReviews;
        asset.averageRating = averageRating;

        // Persist both Review arrays and Metadata consecutively
        await Promise.all([
            uploadFile(
                reviewsPath,
                Buffer.from(JSON.stringify(reviews, null, 2)).toString("base64"),
                `Publish review by ${userId} on asset ${id}`
            ),
            uploadFile(
                `Marketplace/Asset/${id}/metadata.json`,
                Buffer.from(JSON.stringify(asset, null, 2)).toString("base64"),
                `Update average rating metrics for asset ${id}`
            )
        ]);

        return NextResponse.json({ success: true, reviews, averageRating, totalReviews });
    } catch (e: any) {
        console.error("Review submission error:", e);
        return NextResponse.json({ error: "Submission failed", details: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const dataStr = await getFileContent(`Marketplace/Asset/${id}/reviews.json`);
        
        if (!dataStr) return NextResponse.json({ success: true, reviews: [] });
        return NextResponse.json({ success: true, reviews: JSON.parse(dataStr) });
    } catch (e: any) {
        if (e.status === 404) return NextResponse.json({ success: true, reviews: [] });
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}
