"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    picture: string;
    username?: string;
    notifyBadWords?: boolean;
    banned?: {
        isBanned: boolean;
        reason: string;
        type: "temp" | "perm";
        expiresAt?: string;
    };
    favorites?: string[];
}

interface AuthContextType {
    user: UserProfile | null;
    login: (credentialResponse: any) => Promise<void>;
    logout: () => void;
    updateUser: (userData: UserProfile) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Using the provided Client ID
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "308189275559-463hh72v4qto39ike23emrtc4r51galf.apps.googleusercontent.com";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check for existing session from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("excalibur_user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            
            // Background sync on refresh to catch bans or profile changes instantly
            if (parsed.id) {
                fetch(`/api/users/byId/${parsed.id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.profile) {
                            setUser(data.profile);
                            localStorage.setItem("excalibur_user", JSON.stringify(data.profile));
                        }
                    })
                    .catch(e => console.error("Background auth sync failed", e))
                    .finally(() => setIsLoading(false));
                return;
            }
        }
        setIsLoading(false);
    }, []);

    // Strict Ban Enforcement
    useEffect(() => {
        if (!isLoading && user?.banned?.isBanned) {
            const bannedUrl = `/${user.id}/${user.username || "user"}/banned`;
            if (pathname !== bannedUrl) {
                router.replace(bannedUrl);
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = async (tokenResponse: any) => {
        try {
            // If we got an access token from useGoogleLogin
            if (tokenResponse.access_token) {
                // Fetch user info from Google directly
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });

                if (!userInfoRes.ok) throw new Error("Failed to fetch user info");
                const userInfo = await userInfoRes.json();

                // Sync to our backend (which handles GitHub persist)
                const res = await fetch("/api/auth/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // Send the raw data to backend instead of JWT
                    body: JSON.stringify({
                        profile: {
                            sub: userInfo.sub,
                            email: userInfo.email,
                            name: userInfo.name,
                            picture: userInfo.picture
                        }
                    }),
                });

                if (!res.ok) throw new Error("Failed to sync profile");

                const data = await res.json();
                setUser(data.user);
                localStorage.setItem("excalibur_user", JSON.stringify(data.user));
            } else if (tokenResponse.credential) {
                // Fallback if using standard GoogleLogin component
                const res = await fetch("/api/auth/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: tokenResponse.credential }),
                });

                if (!res.ok) throw new Error("Failed to sync profile");

                const data = await res.json();
                setUser(data.user);
                localStorage.setItem("excalibur_user", JSON.stringify(data.user));
            } else {
                throw new Error("No valid credential received");
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("excalibur_user");
    };

    const updateUser = (userData: UserProfile) => {
        setUser(userData);
        localStorage.setItem("excalibur_user", JSON.stringify(userData));
    };

    const isBannedUrl = user?.banned?.isBanned ? pathname === `/${user.id}/${user.username || "user"}/banned` : false;

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
                {user?.banned?.isBanned && !isBannedUrl ? null : children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
