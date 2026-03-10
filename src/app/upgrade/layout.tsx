import { SessionProvider } from "next-auth/react";

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
