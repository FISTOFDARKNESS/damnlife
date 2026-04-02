import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const assetId = req.nextUrl.searchParams.get("assetId");
    const type = req.nextUrl.searchParams.get("type"); // thumbnail, preview, file, forum
    const ext = req.nextUrl.searchParams.get("ext") || "";

    if (!assetId || !type) {
        return new NextResponse("Invalid or missing parameters", { status: 400 });
    }

    const OWNER = process.env.GITHUB_OWNER || "FISTOFDARKNESS";
    const REPO = process.env.GITHUB_REPO || "excaliburstore";
    const BRANCH = process.env.GITHUB_BRANCH || "main";

    let path = "";
    if (type === "thumbnail") path = `Marketplace/Asset/${assetId}/thumbnail.png`;
    else if (type === "preview") path = `Marketplace/Asset/${assetId}/preview.mp4`;
    else if (type === "file") path = `Marketplace/Asset/${assetId}/file${ext}`;
    else if (type === "forum") path = `Marketplace/Forums/${assetId}/image.jpg`;
    else return new NextResponse("Invalid type", { status: 400 });

    const githubUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;

    try {
        const response = await fetch(githubUrl, {
            headers: {}
        });

        if (!response.ok) {
            return new NextResponse("Failed to fetch media", { status: response.status });
        }

        // Determine content type
        let contentType = "application/octet-stream";
        if (githubUrl.endsWith(".jpg") || githubUrl.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (githubUrl.endsWith(".png")) contentType = "image/png";
        else if (githubUrl.endsWith(".webp")) contentType = "image/webp";
        else if (githubUrl.endsWith(".mp4")) contentType = "video/mp4";

        const headers: any = {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
        };

        const extMatch = githubUrl.match(/\.(rbxl|rbxm|rbxmx)$/i);
        if (extMatch) {
            headers["Content-Disposition"] = `attachment; filename="asset_${assetId}.${extMatch[1].toLowerCase()}"`;
        }

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
