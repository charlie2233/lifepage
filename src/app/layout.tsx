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
    "Turn your work into a stunning portfolio in minutes. Powered by AI. Built by atrak.dev.",
  metadataBase: getSiteUrl(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LifePage — AI Personal Brand Builder",
    description:
      "Turn your work into a stunning portfolio in minutes. Powered by AI. Built by atrak.dev.",
    siteName: "LifePage",
    type: "website",
    url: "/",
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
