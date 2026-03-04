import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifePage — AI Personal Brand Builder",
  description:
    "Turn your work into a stunning portfolio in minutes. Powered by AI. Built by atrak.dev.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
