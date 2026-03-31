import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Fraunces,
  IBM_Plex_Mono,
  Manrope,
  Sora,
  Space_Grotesk,
} from "next/font/google";
import { assertCoreRuntimeConfig } from "@/lib/runtime-config";
import { getSiteUrl } from "@/lib/site-metadata";
import "./globals.css";

assertCoreRuntimeConfig();

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const displayAlt = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display-alt",
  weight: ["400", "500", "600", "700"],
});

const sansAlt = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-alt",
});

const sansSharp = Sora({
  subsets: ["latin"],
  variable: "--font-sans-sharp",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LifePage — AI Personal Brand Builder",
  description:
    "Turn proof from GitHub, websites, docs, and videos into a public portfolio, resume, and personal brand site people can verify.",
  metadataBase: getSiteUrl(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LifePage — AI Personal Brand Builder",
    description:
      "Turn proof from GitHub, websites, docs, and videos into a public portfolio, resume, and personal brand site people can verify.",
    siteName: "LifePage",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LifePage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifePage — AI Personal Brand Builder",
    description:
      "Turn proof from GitHub, websites, docs, and videos into a public portfolio, resume, and personal brand site people can verify.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${displayAlt.variable} ${sansAlt.variable} ${sansSharp.variable} ${mono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
