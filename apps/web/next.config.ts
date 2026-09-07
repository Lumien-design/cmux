import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF first, WebP as the automatic fallback. Masters are committed as
    // WebP; the optimiser negotiates the rest.
    formats: ['image/avif', 'image/webp'],
  },
  // The token layer lives in a sibling workspace package.
  transpilePackages: ['@cmux/tokens'],
};

export default nextConfig;
