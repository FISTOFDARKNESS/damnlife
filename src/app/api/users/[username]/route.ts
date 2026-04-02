import { NextRequest, NextResponse } from "next/server";
import { getUsernameRegistry, getUserProfile, octokit, registerUsername } from "@/lib/github";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    try {
        const { username } = await params;

        // Find the user ID for this username (Case-Insensitive)
        const registry = await getUsernameRegistry();
        // Find the user ID for this username (Case-Insensitive search through registry)
        let lowerUsername = username.toLowerCase();
        let entry = Object.entries(registry).find(([key]) => key.toLowerCase() === lowerUsername);
        let userId = entry ? (entry[1] as string) : null;

        // --- SELF-HEALING REGISTRY ---
        // If not found in registry, search all profiles once to "discover" this user
        if (!userId) {
            try {
                const OWNER = "FISTOFDARKNESS";
                const REPO = "excaliburstore";
                const { data } = await octokit.rest.git.getTree({
                    owner: OWNER,
                    repo: REPO,
                    tree_sha: "main",
                    recursive: "true",
                });

                const profileFiles = data.tree.filter(
                    (t: any) => t.path && t.path.startsWith('Marketplace/Users/') && t.path.endsWith('/profile.json')
                );

                for (const file of profileFiles) {
                    const contentRes = await octokit.rest.repos.getContent({
                        owner: OWNER,
                        repo: REPO,
                        path: file.path,
                        ref: "main",
                    });

                    if ("content" in contentRes.data && !Array.isArray(contentRes.data)) {
                        const profile = JSON.parse(Buffer.from(contentRes.data.content, 'base64').toString());
                        if (profile.username && profile.username.toLowerCase() === lowerUsername) {
                            userId = profile.id;
                            // Register it now so it's fast next time
                            await registerUsername(profile.username, userId);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error("Registry discovery failed:", e);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        // Fetch the user's profile using the ID
        const profile = await getUserProfile(userId);

        if (!profile) {
            return NextResponse.json({ error: "Profile missing data." }, { status: 404 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (error: any) {
        console.error("Fetch profile error:", error);
        return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }
}
