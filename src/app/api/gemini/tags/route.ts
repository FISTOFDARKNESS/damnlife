import { NextRequest, NextResponse } from "next/server";
import { generateKeywords } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
        }

        const tags = await generateKeywords(title, description);

        return NextResponse.json({ tags });
    } catch (error: any) {
        console.error("API Gemini Tags Error:", error);
        return NextResponse.json({ error: "Failed to generate tags." }, { status: 500 });
    }
}
