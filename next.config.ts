import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * script-src:
 *   - Development: unsafe-eval needed by Turbopack/HMR; unsafe-inline for dev overlays.
 *   - Production: unsafe-eval REMOVED (eliminates script-injection attack surface).
 *     unsafe-inline is retained because Next.js App Router injects inline hydration
 *     scripts that cannot be nonce-controlled without a custom middleware rewrite.
 *     Long-term: replace unsafe-inline with nonces via middleware-generated CSP headers.
 *
 * frame-ancestors: 'none' is the strict directive (no framing allowed).
 * X-Frame-Options is omitted — CSP frame-ancestors supersedes it in all modern browsers,
 * and keeping both with different values creates a confusing, auditable inconsistency.
 */
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Service Worker must not be cached — browser needs to detect updates immediately
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
