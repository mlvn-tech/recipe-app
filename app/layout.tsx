import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import { UIProvider } from "@/components/UIContext";
import { OverlayProvider } from "@/components/GlobalOverlay";

import { Nunito } from "next/font/google";
import { Poppins } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-nunito",
});

const rubik = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recepten",
  description: "Mijn recepten app",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  themeColor: "#000000",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${rubik.variable} antialiased bg-[var(--color-bg)] text-[#171717] h-full`}
        >
          <AuthGuard>
            <UIProvider>
              <OverlayProvider>
                <AppShell>{children}</AppShell>
              </OverlayProvider>
            </UIProvider>
          </AuthGuard>

          <Toaster richColors toastOptions={{ style: { zIndex: 30 } }} />
        </body>
      </html>
    </ViewTransitions>
  );
}
