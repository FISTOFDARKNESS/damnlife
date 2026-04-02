import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, saveUserProfile, getUsernameRegistry, uploadFile, reportItem } from "@/lib/github";
import { containsBadWord } from "@/lib/profanity";

export async function POST(req: NextRequest) {
    try {
        const { userId, name, username, aboutMe, discordLink, notifyBadWords, ignoreProfanity } = await req.json();

        if (!userId || !name || !username) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validUsernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!validUsernameRegex.test(username)) {
            return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
        }

        const badWord = containsBadWord(`${name} ${username} ${aboutMe || ''}`);
        if (badWord && !ignoreProfanity) {
            return NextResponse.json({ error: "Profanity detected", badWord }, { status: 400 });
        }

        if (badWord && ignoreProfanity) {
            reportItem({
                type: "profanity",
                targetId: userId,
                assetId: "profile",
                reporterEmail: "system",
                reason: `User ignored profanity warning on profile edit: "${badWord}"`
            }).catch(e => console.error(e));
        }

        // Fetch current profile
        const profile = await getUserProfile(userId);
        if (!profile) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        const currentUsername = profile.username;
        const registry = await getUsernameRegistry();

        // If the username is being changed, check for uniqueness
        if (currentUsername !== username) {
            if (registry[username] && registry[username] !== userId) {
                return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
            }

            // Remove old username mapping
            if (currentUsername && registry[currentUsername] === userId) {
                delete registry[currentUsername];
            }

            // Assign new username mapping
            registry[username] = userId;

            // Save new registry
            const registryContent = Buffer.from(JSON.stringify(registry, null, 2)).toString('base64');
            await uploadFile('Marketplace/Registry/usernames.json', registryContent, `Update registry for new username ${username}`);
        }

        // Update profile
        profile.name = name;
        profile.username = username;
        if (aboutMe !== undefined) profile.aboutMe = aboutMe;
        if (discordLink !== undefined) profile.discordLink = discordLink;
        if (notifyBadWords !== undefined) profile.notifyBadWords = !!notifyBadWords;
        await saveUserProfile(userId, profile);

        return NextResponse.json({ success: true, profile });
    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
