import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Fraunces,
  IBM_Plex_Mono,
  Manrope,
  Sora,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/site";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: "https://atrak.dev" }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  category: "technology",
  keywords: [
    "portfolio builder",
    "personal brand",
    "resume builder",
    "AI portfolio",
    "student portfolio",
    "career portfolio",
    "proof-based resume",
  ],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/og-lifepage.svg"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} open graph image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/og-lifepage.svg")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
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
