# The Excalibur Store

Welcome to the Excalibur Platform! This is a state-of-the-art Next-Gen Next.js digital asset marketplace and dynamic social network designed specifically for creators.

---

### 🌟 The Core Concept
Instead of a traditional database, Excalibur runs entirely on a fully serverless **GitHub Architecture**. Everything from user profile pictures and bios to the downloadable `.rbxm` files and nested comments are persistently stored and retrieved from a native GitHub repository using Octokit.

--- 

### 👤 Identity & Profiles
*   **Google OAuth Login**: Users can instantly authenticate and create an account securely using their Google accounts.
*   **Custom Profiles**: Users can edit their `@username`, Display Name, "About Me" bio, and profile picture.
*   **Follow System**: You can actively follow or unfollow other creators on the platform.
*   **Interactive Social Networks**: Clicking on a user’s "Followers" or "Following" numbers opens a sleek, glassmorphic modal displaying a complete list of their network. It shows each user's avatar, badge, follower count, and published assets, allowing you to click and teleport straight to their profile.
*   **Creator Verification**: Admins can bestow blue "Verified" checkmarks to trusted creators. Verified users get extreme perks, primarily having their uploaded assets completely bypass the standard moderation queue.

---

### 🚀 The Marketplace
*   **Uplink (Asset Uploads)**: Creators can upload standalone `.rbxm` assets alongside rich titles, deep descriptions, pricing models (Free/Paid), search tags, and a custom image thumbnail. 
*   **Explore Feed**: The main hub of the platform where users can seamlessly scroll through published assets. It features a live search bar and clickable categorization tags for dynamic filtering.
*   **Secure Downloads**: Users can click to download a creator's asset files locally to their device. The system ensures only logged-in users can download and tracks real-time download metrics.

---

### 💬 Community Engagement
*   **Asset Commenting**: Every asset features a dedicated discussion board.
*   **Discord-Style Replies**: The comment sections support infinite depth threading. If you reply to a specific comment, it neatly nests underneath it, allowing for organized visual conversations between creators.

---

### 🛡️ Moderation & Safety Systems
*   **The ModQueue**: If an unverified user uploads an asset, it is placed in a "Pending" status. It remains completely hidden from the Explore feed until an Admin reviews and stamps it as "Approved".
*   **Anti-Profanity Engine**: A strict, Regex-powered profanity filter patrols user inputs (bios, usernames, asset titles, and comments) using a centralized dictionary list. If a user attempts to use a bad word, they are blocked by a heavy warning modal.
*   **Automated Actionable Reports**: If a user intentionally bypasses the profanity warning, the system still posts it but silently dispatches an official infraction report to the Administrative Staff.
*   **Owner Notifications**: Asset owners have a setting they can toggle to receive system alerts if someone uses profanity within the comment section of their specific uploads.
*   **Admin Reports Portal**: A dedicated portal accessible only by Admins (`/admin/reports`) aggregating all flagged content, unresolved disputes, and system-generated profanity alerts for review.
*   **Global Ban System**: Admins can issue **Temporary** or **Permanent** global bans directly from a user's profile. Banned users are aggressively locked out of the entire application by the React Context and forcefully trapped on a deep-red `Banned` screen displaying a live expiration countdown timer and the official reason for their ban.

---

### ⚡ Performance & Preferences
*   **Global Foreground Preloader**: To make the site feel like a native desktop app, a hidden background mechanism engages 2 seconds after the site loads. It silently caches the global asset registry into the browser and forces the browser's RAM to pre-download all asset thumbnails. This ensures that when a user subsequently clicks on an asset or scrolls, there is zero loading latency or visual layout shifting.
*   **Performance Scaling**: In the UI Settings module, users can hit a toggle to disable "Next-Gen UI". This strips away the heavy CSS backdrop blurs and glassmorphism elements to ensure the site runs flawlessly on older or low-budget hardware.

---

## Tech Stack
- **Framework**: Next.js 15 (React 19, Server Components)
- **Styling**: Tailwind CSS v4, Lucide React (Iconography)
- **Database Architecture**: GitHub REST API (Octokit serverless layer)
- **Authentication**: React Google OAuth Provider Context
