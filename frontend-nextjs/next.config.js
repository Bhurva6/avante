/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',       // Static export so Flask can serve the files
  reactStrictMode: true,
  images: {
    unoptimized: true,    // Required for static export
  },
  basePath: '',
  assetPrefix: '/',
  trailingSlash: true,    // Ensures /login/ works as a static file path
};

module.exports = nextConfig;
