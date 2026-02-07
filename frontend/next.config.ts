import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/* Backend URL used ONLY by the server-side rewrite proxy.
   Use BACKEND_PROXY_URL for local dev (defaults to localhost:8080).
   NEXT_PUBLIC_BACKEND_URL is a fallback for deployed environments. */
const BACKEND_URL = (
  process.env.BACKEND_PROXY_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8080'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  /* Pin Turbopack root to the frontend dir so it resolves node_modules here,
     not from the git/monorepo root which has no node_modules */
  turbopack: {
    root: path.resolve(__dirname),
  },
  /* Proxy all /api requests to the backend so cookies live on the frontend domain */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
