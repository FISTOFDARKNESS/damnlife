import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { PreloadProvider } from "@/components/providers/PreloadProvider";
import { Navbar } from "@/components/ui/Navbar";
import SecurityWrapper from "@/components/ui/SecurityWrapper";

const outfit = Outfit({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Excalibur Store - Next-Gen Roblox Assets",
  description: "Immersive marketplace for Roblox developers, powered by GitHub and Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-dark-bg text-white antialiased selection:bg-violet-500/30`}>
        <SettingsProvider>
          <AuthProvider>
            <PreloadProvider>
              <SecurityWrapper>
                <Navbar />
                <main className="min-h-screen pt-20">
                  {children}
                </main>
              </SecurityWrapper>
            </PreloadProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
