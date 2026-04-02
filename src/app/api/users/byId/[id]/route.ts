import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/github";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const profile = await getUserProfile(id);

        if (!profile) {
            return NextResponse.json({ error: "Profile missing data." }, { status: 404 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (error: any) {
        console.error("Fetch profile by ID error:", error);
        return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }
}
