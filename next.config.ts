import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
