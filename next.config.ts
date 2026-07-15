import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone / LAN access in `next dev`. Without this, HTML loads over the
  // LAN IP but /_next chart JS is blocked (numbers show, graphs don't).
  allowedDevOrigins: [
    "10.100.102.10",
    "127.0.0.1",
  ],
};

export default nextConfig;
