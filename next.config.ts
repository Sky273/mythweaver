import type { NextConfig } from "next";

// No `output: "standalone"` here — that was for the Docker runtime image;
// Vercel packages the build itself and doesn't need/want it.
const nextConfig: NextConfig = {};

export default nextConfig;
