import { NextRequest, NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/github";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        await markNotificationsRead(userId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Mark Notifications Error:", error);
        return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
    }
}
