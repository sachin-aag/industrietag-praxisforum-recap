import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Industrietag Rems-Murr Praxisforum 2026 – Rückblick",
    short_name: "Praxisforum 2026",
    description: "Rückblick auf das Praxisforum „KI in Planung, Bau und Gebäudebetrieb“ am 10. November 2026.",
    start_url: "/de/",
    display: "browser",
    background_color: "#f4f6fa",
    theme_color: "#2a4b9b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
