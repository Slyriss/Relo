import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Relo - Relationship OS for events",
  description: "Meet the right people, log real-world conversations, and prove event ROI.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Relo",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
