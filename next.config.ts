import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Clerk-hosted member avatars (Members roster).
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
};

export default nextConfig;
