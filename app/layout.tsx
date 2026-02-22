import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="en">
        <body
          className={`
    ${geistSans.variable} 
    ${geistMono.variable} 
    antialiased 
    bg-[var(--color-bg)]
    text-[#171717]
  `}
        >
          <AppShell>{children}</AppShell>
          <Toaster
            richColors
            toastOptions={{
              style: {
                zIndex: 30,
              },
            }}
          />
        </body>
      </html>
    </ViewTransitions>
  );
}
