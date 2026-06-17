import type { NextConfig } from "next";

// Applied to every response (security audit F1).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'", // clickjacking (with X-Frame-Options below)
      "form-action 'self'",
      "img-src 'self' data:",
      "font-src 'self'", // next/font self-hosts; no external font CDN
      "style-src 'self' 'unsafe-inline'", // Next injects critical inline styles
      // NOTE: Next.js App Router injects inline hydration/RSC bootstrap
      // scripts, so a config-level CSP must allow 'unsafe-inline' here.
      // Tightening script-src to a per-request nonce requires middleware +
      // dynamic rendering — tracked as follow-up hardening, not done here.
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'", // the form POSTs to same-origin /api/subscribe
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
