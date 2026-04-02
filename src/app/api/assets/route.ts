import { NextResponse } from "next/server";
import { getAllAssets } from "@/lib/github";

// Revalidate every 60 seconds (or 0 for absolute dynamic)
export const revalidate = 60;

export async function GET() {
    try {
        let assets = await getAllAssets();
        // Only show approved assets, or legacy assets (no status)
        assets = assets.filter((a: any) => a.status !== "pending" && a.status !== "rejected");

        return NextResponse.json({ success: true, assets });
    } catch (error: any) {
        console.error("API GET Assets Error:", error);
        return NextResponse.json({ error: "Failed to fetch assets.", details: error.message }, { status: 500 });
    }
}
