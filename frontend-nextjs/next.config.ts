import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',       // Static export so Flask can serve the files
  reactStrictMode: true,
  images: {
    unoptimized: true,    // Required for static export
  },
  basePath: '',
  assetPrefix: '/',
  trailingSlash: true,
};

export default nextConfig;
