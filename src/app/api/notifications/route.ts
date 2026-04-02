import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/github";

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const notifications = await getNotifications(userId);
        return NextResponse.json({ success: true, notifications });
    } catch (error: any) {
        console.error("Get Notifications Error:", error);
        return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 });
    }
}
