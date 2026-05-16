import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Relo - Relationship intelligence for live events",
    template: "%s | Relo",
  },
  description: "Meet the right people, log real-world conversations, and prove event ROI.",
  applicationName: "Relo",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Relo - Relationship intelligence for live events",
    description: "Role-aware event operations, attendee matching, live research, and meeting capture for enterprise events.",
    url: "/",
    siteName: "Relo",
    type: "website",
    images: [
      {
        url: "/relo-assets/landing-hero-mesh.png",
        width: 1200,
        height: 630,
        alt: "Relo event relationship intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Relo - Relationship intelligence for live events",
    description: "Role-aware event operations, attendee matching, live research, and meeting capture for enterprise events.",
    images: ["/relo-assets/landing-hero-mesh.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Relo",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
