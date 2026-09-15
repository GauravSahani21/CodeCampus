import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Required for Next.js 16 Turbopack (enabled by default)
  turbopack: {},
};

export default nextConfig;

