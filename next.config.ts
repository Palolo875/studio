import type {NextConfig} from 'next';
import * as path from 'path';

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
  },
  serverExternalPackages: ['@huggingface/transformers'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
  allowedDevOrigins:
    process.env.NODE_ENV === 'development'
      ? [
          'https://6c99c0df-1cb0-482a-9c0b-59237eea8ddb-00-3neiw8wt7yfxb.picard.replit.dev',
          '*.replit.dev',
          'http://127.0.0.1:5000',
          'http://localhost:5000',
        ]
      : [],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
