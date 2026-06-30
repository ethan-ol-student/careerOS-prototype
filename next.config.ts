import type { NextConfig } from "next";

/**
 * Career OS — Next.js config.
 *
 * Security headers, image remote patterns, and hardening live here (not in
 * vercel.json) so they apply uniformly in `next dev`, `next start`, and on
 * Vercel. The CSRF/cross-origin gate stays in `src/middleware.ts`.
 */

// Long-lived, app-wide security headers applied to every route.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains (safe on Vercel domains).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow framing (clickjacking) — the app is never embedded.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URLs to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop access to powerful features we never use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Defense-in-depth for the httpOnly session cookie / framing.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  // Never advertise the framework/version.
  poweredByHeader: false,

  // Fail the production build on type errors (the default, kept explicit for
  // the deploy gate). Next.js 16 removed the `eslint` config key — linting is
  // enforced separately by `npm run lint` in CI.
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },

  // Image optimization. No external image hosts are referenced today (only
  // local marketing assets), so remotePatterns is intentionally empty.
  // Add hosts here when avatars/logos are served from a CDN, e.g. Neon-backed
  // uploads or an avatar service.
  images: {
    remotePatterns: [
      // Example (uncomment + edit when a real image host is introduced):
      // { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Never cache API responses (all are session/cookie-scoped).
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
      // Note: Next.js already serves `/_next/static/*` with
      // `immutable, max-age=31536000` — overriding it here is unnecessary and
      // Next warns it can break dev behavior, so we don't.
    ];
  },
};

export default nextConfig;
