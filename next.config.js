/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Fix: Anti-clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Fix: Content-Type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Fix: X-Powered-By leak
          {
            key: 'X-Powered-By',
            value: '',
          },
          // Fix: Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Fix: Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          // Fix: Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              "frame-src https://js.stripe.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          // Fix: HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
