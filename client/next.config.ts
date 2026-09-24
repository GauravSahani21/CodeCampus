import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/learn',
        destination: '/problems',
        permanent: false,
      },
      {
        source: '/learn/:path*',
        destination: '/problems',
        permanent: false,
      },
      {
        source: '/instructor/courses',
        destination: '/instructor/problems',
        permanent: false,
      },
      {
        source: '/instructor/courses/:path*',
        destination: '/instructor/problems',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

