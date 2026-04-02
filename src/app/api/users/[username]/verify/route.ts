import { NextRequest, NextResponse } from "next/server";
import { setVerifyUser, getUsernameRegistry } from "@/lib/github";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    try {
        const { username } = await params;
        const { adminEmail, verified } = await req.json();

        if (adminEmail !== "kaioadrik08@gmail.com") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const registry = await getUsernameRegistry();
        const targetId = registry[username] || username;

        const isVerified = await setVerifyUser(targetId, verified);

        return NextResponse.json({ success: true, verified: isVerified });
    } catch (error: any) {
        console.error("Verify Error:", error);
        return NextResponse.json({ error: "Failed to set verification status", details: error.message }, { status: 500 });
    }
}
