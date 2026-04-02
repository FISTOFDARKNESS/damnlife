import { Octokit } from 'octokit';

// Server-side only: Ensure this is never leaked to the client.
const GITHUB_PAT = process.env.GITHUB_PAT;
const OWNER = "FISTOFDARKNESS";
const REPO = "excaliburstore";
const BRANCH = "main";

export const octokit = new Octokit({
    auth: GITHUB_PAT
});

// Rate Limit Constants
const LIMITS = {
    UNVERIFIED: { download: 5, upload: 5 },
    VERIFIED: { download: 25, upload: 30 }
};

export async function getFileContent(path: string) {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path,
            ref: BRANCH,
        });

        if (Array.isArray(response.data)) {
            throw new Error("Target is a directory, not a file.");
        }

        if (response.data.type === "file" && response.data.content) {
            // Decode Base64 content from GitHub
            const buffer = Buffer.from(response.data.content, 'base64');
            return buffer.toString('utf8');
        }
        return null;
    } catch (error: any) {
        if (error.status === 404) return null;
        throw error;
    }
}

export async function uploadFile(path: string, contentBase64: string, message: string) {
    // First, get the current file's SHA if it exists (required for updates)
    let sha: string | undefined;
    try {
        const currentFile = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path,
            ref: BRANCH,
        });
        if (!Array.isArray(currentFile.data) && currentFile.data.type === "file") {
            sha = currentFile.data.sha;
        }
    } catch (error: any) {
        if (error.status === 401) {
            throw new Error(`[401] Invalid/Revoked Token`);
        }
        if (error.status !== 404) throw error;
    }

    // Then upload/update the file
    try {
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path,
            message,
            content: contentBase64,
            branch: BRANCH,
            ...(sha ? { sha } : {})
        });
    } catch (error: any) {
        if (error.status === 401 || error.status === 403) {
            throw new Error(`[${error.status}] GitHub blocked the upload due to an Invalid/Expired Token. Create the .env.local file with a valid new GITHUB_PAT to be able to publish successfully.`);
        }
        throw new Error(`GitHub Upload Error: ${error.message}`);
    }
}

// Custom specialized fetch functions
export async function getUserProfile(userId: string) {
    const content = await getFileContent(`Marketplace/Users/${userId}/profile.json`);
    return content ? JSON.parse(content) : null;
}

export async function saveUserProfile(userId: string, profileData: any) {
    const content = Buffer.from(JSON.stringify(profileData, null, 2)).toString('base64');
    await uploadFile(`Marketplace/Users/${userId}/profile.json`, content, `Sync profile for user ${userId}`);
}

export async function getAllAssets() {
    try {
        const { data } = await octokit.rest.git.getTree({
            owner: OWNER,
            repo: REPO,
            tree_sha: BRANCH,
            recursive: "true",
        });

        const assetMetadataFiles = data.tree.filter(
            (t: any) => t.path && t.path.startsWith('Marketplace/Asset/') && t.path.endsWith('/metadata.json')
        );

        const assets = await Promise.all(
            assetMetadataFiles.map(async (file: any) => {
                const id = file.path.split('/')[2];
                const metadataStr = await getFileContent(file.path);
                if (metadataStr) {
                    try {
                        const meta = JSON.parse(metadataStr);
                        meta.thumbnailUrl = `/api/proxy/thumbnail?assetId=${id}&type=thumbnail`;
                        return meta;
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            })
        );

        const filteredAssets = assets.filter(a => a !== null);

        // Enrich with usernames from registry for better routing
        const registry = await getUsernameRegistry();
        const idToUsername: Record<string, string> = {};
        Object.entries(registry).forEach(([uname, uid]) => {
            idToUsername[uid as string] = uname;
        });

        return filteredAssets.map(asset => ({
            ...asset,
            ownerUsername: asset.ownerUsername || (asset.ownerId ? idToUsername[asset.ownerId] : undefined)
        }));
    } catch (error: any) {
        if (error.status === 404) {
            console.warn(`[GitHub] 'Marketplace/Asset' not found. Initializing...`);
            await uploadFile('Marketplace/Asset/.keep', Buffer.from('').toString('base64'), 'Initialize Marketplace/Asset directory');
            return [];
        }
        throw error;
    }
}

export async function getAssetById(id: string) {
    try {
        const metadataStr = await getFileContent(`Marketplace/Asset/${id}/metadata.json`);
        if (!metadataStr) return null;

        const meta = JSON.parse(metadataStr);
        meta.id = id;
        meta.thumbnailUrl = `/api/proxy/thumbnail?assetId=${id}&type=thumbnail`;

        // Enrich with username if possible
        if (!meta.ownerUsername && meta.ownerId) {
            const registry = await getUsernameRegistry();
            const entry = Object.entries(registry).find(([_, uid]) => uid === meta.ownerId);
            if (entry) meta.ownerUsername = entry[0];
        }

        // Also fetch comments if they exist
        const commentsStr = await getFileContent(`Marketplace/Asset/${id}/comments.json`);
        meta.comments = commentsStr ? JSON.parse(commentsStr) : [];

        return meta;
    } catch (error: any) {
        if (error.status === 401 || error.status === 403) {
            console.warn(`[GitHub Mock mode] getAssetById fallback for ${id}`);
            return {
                id,
                title: "Mock Asset " + id,
                author: "MockAuthor",
                price: 500,
                tags: ["Mock", "Asset"],
                description: "This is a mock asset because api is blocked or unauthenticated.",
                comments: [
                    { id: "c1", author: "User1", text: "Great mock asset!", timestamp: new Date().toISOString() }
                ]
            };
        }
        return null;
    }
}

export async function getUsernameRegistry() {
    try {
        const data = await getFileContent('Marketplace/Registry/usernames.json');
        if (!data) throw new Error("Not found");
        return JSON.parse(data);
    } catch {

        console.warn(`[GitHub] 'Marketplace/Registry/usernames.json' not found. Initializing...`);
        const initialContent = Buffer.from('{}').toString('base64');
        await uploadFile('Marketplace/Registry/usernames.json', initialContent, 'Initialize usernames registry');
        return {};
    }
}

export async function registerUsername(username: string, userId: string) {
    const registry = await getUsernameRegistry();
    const lowerUsername = username.toLowerCase();

    if (registry[lowerUsername] && registry[lowerUsername] !== userId) {
        throw new Error('Username already taken.');
    }
    registry[lowerUsername] = userId;
    const content = Buffer.from(JSON.stringify(registry, null, 2)).toString('base64');
    await uploadFile('Marketplace/Registry/usernames.json', content, `Register username ${username}`);
}

export async function getAssetMetadata(assetId: string) {
    const data = await getFileContent(`Marketplace/Asset/${assetId}/metadata.json`);
    return data ? JSON.parse(data) : null;
}

export async function deleteAsset(assetId: string, authorMessage: string) {
    const assetPath = `Marketplace/Asset/${assetId}`;
    try {
        // Fetch the directory contents
        const response = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: assetPath,
            ref: BRANCH,
        });

        if (!Array.isArray(response.data)) {
            throw new Error("Asset path is not a directory.");
        }

        // Delete each file in the directory
        for (const file of response.data) {
            if (file.type === "file") {
                await octokit.rest.repos.deleteFile({
                    owner: OWNER,
                    repo: REPO,
                    path: file.path,
                    message: authorMessage,
                    sha: file.sha,
                    branch: BRANCH,
                });
            }
        }
        return true;
    } catch (error: any) {
        if (error.status === 404) return false; // Already deleted or doesn't exist
        throw new Error(`Failed to delete asset: ${error.message}`);
    }
}

export async function updateAssetMetadata(assetId: string, metadata: any, message: string) {
    const metaPath = `Marketplace/Asset/${assetId}/metadata.json`;
    const content = Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64');
    await uploadFile(metaPath, content, message);
}

export async function getDownloadRegistry(assetId: string) {
    const path = `Marketplace/Asset/${assetId}/downloads_registry.json`;
    try {
        const dataStr = await getFileContent(path);
        return dataStr ? JSON.parse(dataStr) : [];
    } catch (e) {
        return [];
    }
}

export async function addToDownloadRegistry(assetId: string, ip: string) {
    const path = `Marketplace/Asset/${assetId}/downloads_registry.json`;
    let registry = await getDownloadRegistry(assetId);

    if (!registry.includes(ip)) {
        registry.push(ip);
        const content = Buffer.from(JSON.stringify(registry, null, 2)).toString('base64');
        await uploadFile(path, content, `Record download from IP for asset ${assetId}`);
    }
}

// -----------------------------------------------------
// NOTIFICATIONS API
// -----------------------------------------------------

export async function addNotification(userId: string, notification: any) {
    const path = `Marketplace/Users/${userId}/notifications.json`;
    let notifications = [];
    try {
        const dataStr = await getFileContent(path);
        if (dataStr) notifications = JSON.parse(dataStr);
    } catch (e) { }

    notifications.unshift({
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        read: false
    });

    // limit to 50
    if (notifications.length > 50) notifications = notifications.slice(0, 50);

    const content = Buffer.from(JSON.stringify(notifications, null, 2)).toString('base64');
    await uploadFile(path, content, `Add notification for user ${userId}`);
}

export async function getNotifications(userId: string) {
    const path = `Marketplace/Users/${userId}/notifications.json`;
    try {
        const dataStr = await getFileContent(path);
        return dataStr ? JSON.parse(dataStr) : [];
    } catch (e) {
        return [];
    }
}

export async function markNotificationsRead(userId: string) {
    const path = `Marketplace/Users/${userId}/notifications.json`;
    try {
        const dataStr = await getFileContent(path);
        if (dataStr) {
            const notifications = JSON.parse(dataStr).map((n: any) => ({ ...n, read: true }));
            const content = Buffer.from(JSON.stringify(notifications, null, 2)).toString('base64');
            await uploadFile(path, content, `Mark notifications read for user ${userId}`);
        }
    } catch (e) { }
}

// -----------------------------------------------------
// SOCIAL & VERIFICATION API
// -----------------------------------------------------

export async function toggleFollowUser(followerId: string, targetId: string) {
    const followerProfile = await getUserProfile(followerId);
    const targetProfile = await getUserProfile(targetId);

    if (!followerProfile || !targetProfile) throw new Error("User not found");

    followerProfile.following = followerProfile.following || [];
    targetProfile.followers = targetProfile.followers || [];

    const isFollowing = followerProfile.following.includes(targetId);

    if (isFollowing) {
        followerProfile.following = followerProfile.following.filter((id: string) => id !== targetId);
        targetProfile.followers = targetProfile.followers.filter((id: string) => id !== followerId);
    } else {
        followerProfile.following.push(targetId);
        targetProfile.followers.push(followerId);

        await addNotification(targetId, {
            type: "social",
            title: "New Follower",
            message: `${followerProfile.name} is now following you!`,
            link: `/profile/${followerProfile.username || followerProfile.id}`
        });
    }

    await saveUserProfile(followerId, followerProfile);
    await saveUserProfile(targetId, targetProfile);

    return !isFollowing;
}

export async function setVerifyUser(targetId: string, verified: boolean) {
    const targetProfile = await getUserProfile(targetId);
    if (!targetProfile) throw new Error("User not found");

    targetProfile.verified = verified;
    await saveUserProfile(targetId, targetProfile);

    if (verified) {
        await addNotification(targetId, {
            type: "system",
            title: "Account Verified",
            message: "Congratulations! Your account has been verified by the admins.",
            link: `/profile/${targetProfile.username || targetProfile.id}`
        });
    }
    return verified;
}

// -----------------------------------------------------
// MODERATION & REPORTS API
// -----------------------------------------------------

export async function deleteComment(assetId: string, commentId: string) {
    const commentPath = `Marketplace/Asset/${assetId}/comments.json`;
    try {
        const commentsStr = await getFileContent(commentPath);
        if (!commentsStr) return false;

        let comments = JSON.parse(commentsStr);
        const initialLength = comments.length;
        comments = comments.filter((c: any) => c.id !== commentId);

        if (comments.length !== initialLength) {
            const contentBase64 = Buffer.from(JSON.stringify(comments, null, 2)).toString('base64');
            await uploadFile(commentPath, contentBase64, `Delete comment ${commentId} on asset ${assetId}`);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export async function getReports() {
    const path = `Marketplace/Moderation/reports.json`;
    try {
        const dataStr = await getFileContent(path);
        return dataStr ? JSON.parse(dataStr) : [];
    } catch (e) {
        return [];
    }
}

export async function reportItem(reportData: any) {
    const path = `Marketplace/Moderation/reports.json`;
    let reports = [];
    try {
        const dataStr = await getFileContent(path);
        if (dataStr) reports = JSON.parse(dataStr);
    } catch (e) { }

    reports.unshift({
        ...reportData,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        status: "pending"
    });

    const content = Buffer.from(JSON.stringify(reports, null, 2)).toString('base64');
    await uploadFile(path, content, `New report: ${reportData.type} ${reportData.targetId}`);
    return true;
}

export async function removeReport(reportId: string) {
    const path = `Marketplace/Moderation/reports.json`;
    try {
        const dataStr = await getFileContent(path);
        if (!dataStr) return false;

        let reports = JSON.parse(dataStr);
        reports = reports.filter((r: any) => r.id !== reportId);

        const content = Buffer.from(JSON.stringify(reports, null, 2)).toString('base64');
        await uploadFile(path, content, `Resolve/Remove report ${reportId}`);
        return true;
    } catch (e) {
        return false;
    }
}

export async function checkAndIncrementUsage(userId: string, type: 'download' | 'upload') {
    const profile = await getUserProfile(userId);
    if (!profile) return { success: false, error: "User profile not found." };

    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    // Initialize usage object if it doesn't exist
    if (!profile.usage) {
        profile.usage = {
            download: 0,
            upload: 0,
            lastReset: now.toISOString()
        };
    }

    const lastReset = new Date(profile.usage.lastReset);

    // Reset if more than 1 hour has passed
    if (now.getTime() - lastReset.getTime() > oneHour) {
        profile.usage.download = 0;
        profile.usage.upload = 0;
        profile.usage.lastReset = now.toISOString();
    }

    // Determine current limit based on verification status
    const userLimits = profile.verified ? LIMITS.VERIFIED : LIMITS.UNVERIFIED;
    const currentLimit = userLimits[type];
    const currentCount = profile.usage[type] || 0;

    if (currentCount >= currentLimit) {
        return {
            success: false,
            error: `Hourly ${type} limit reached (${currentLimit}/${type}s per hour).`,
            remaining: 0,
            limit: currentLimit,
            isVerified: !!profile.verified
        };
    }

    // Increment and save
    profile.usage[type] = currentCount + 1;
    await saveUserProfile(userId, profile);

    return {
        success: true,
        remaining: currentLimit - profile.usage[type],
        limit: currentLimit
    };
}
