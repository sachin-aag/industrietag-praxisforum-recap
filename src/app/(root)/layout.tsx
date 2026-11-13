import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Praxisforum 2026 – Rückblick",
  robots: { index: false, follow: true },
  alternates: { canonical: "/de/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4f6fa", color: "#16213f" }}>
        {children}
      </body>
    </html>
  );
}
