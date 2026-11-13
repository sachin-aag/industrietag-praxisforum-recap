import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Praxisforum 2026 – Rückblick",
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
