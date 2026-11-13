import type { NextConfig } from "next";

// No static export any more: pages are still prerendered, but /api/* (magic-link auth + chat) runs as functions.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
