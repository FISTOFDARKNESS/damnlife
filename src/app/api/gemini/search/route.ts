import { NextRequest, NextResponse } from "next/server";
import { expandSemanticQuery } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Search query is required." }, { status: 400 });
        }

        const expandedTerms = await expandSemanticQuery(query);

        return NextResponse.json({ original: query, expanded: expandedTerms });
    } catch (error) {
        console.error("API Gemini Search Expansion Error:", error);
        return NextResponse.json({ error: "Failed to expand query." }, { status: 500 });
    }
}
