import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, saveUserProfile, registerUsername, getUsernameRegistry } from "@/lib/github";

// Simple JWT decoder for Google's id_token (doesn't verify signature since HTTPS provides transport sec and we trust the client to some extent for this demo, though in production you'd use google-auth-library)
function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, profile: clientProfile } = body;

        let payload: any;

        if (token) {
            payload = parseJwt(token);
        } else if (clientProfile) {
            payload = clientProfile;
        } else {
            return NextResponse.json({ error: "Authentication data missing" }, { status: 400 });
        }

        // Google sub is the unique user ID
        const userId = payload.sub;

        // Check if user already exists in GitHub
        let profile = await getUserProfile(userId);

        if (!profile) {
            // Generate a unique username
            const baseUsername = payload.name ? payload.name.replace(/\s+/g, '').toLowerCase() : "user";
            let uniqueUsername = baseUsername;

            // Just a simple safety mechanism to ensure uniqueness
            const registry = await getUsernameRegistry();
            let counter = 1;
            while (registry[uniqueUsername]) {
                uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
                counter++;
                if (counter > 10) break; // fallback safety
            }

            // First time login - create the profile
            profile = {
                id: userId,
                username: uniqueUsername, // NEW FIELD
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                followers: 0,
                following: 0,
                banned: false,
                joinedAt: new Date().toISOString()
            };

            // Save to GitHub
            await saveUserProfile(userId, profile);
            await registerUsername(uniqueUsername, userId);
        } else if (!profile.username) {
            // Retrofit existing profiles without a username
            const baseUsername = profile.name ? profile.name.replace(/\s+/g, '').toLowerCase() : "user";
            let uniqueUsername = baseUsername;
            const registry = await getUsernameRegistry();
            let counter = 1;
            while (registry[uniqueUsername]) {
                uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
                counter++;
                if (counter > 10) break;
            }
            profile.username = uniqueUsername;
            await saveUserProfile(userId, profile);
            await registerUsername(uniqueUsername, userId);
        }

        return NextResponse.json({ success: true, user: profile });
    } catch (error: any) {
        console.error("Auth Sync Error:", error);
        return NextResponse.json({ error: "Authentication failed", details: error.message }, { status: 500 });
    }
}
