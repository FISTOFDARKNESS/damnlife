import { NextRequest, NextResponse } from "next/server";
import { reportItem, getReports } from "@/lib/github";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, targetId, assetId, reason, reporterEmail, extraData } = body;

        if (!type || !targetId || !reason || !reporterEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await reportItem({ type, targetId, assetId, reason, reporterEmail, extraData });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Report Item Error:", error);
        return NextResponse.json({ error: "Failed to report item", details: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get("email");
        if (email !== "kaioadrik08@gmail.com") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const reports = await getReports();
        return NextResponse.json({ success: true, reports });
    } catch (error: any) {
        console.error("Get Reports Error:", error);
        return NextResponse.json({ error: "Failed to fetch reports", details: error.message }, { status: 500 });
    }
}
