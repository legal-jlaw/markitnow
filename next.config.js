/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ── Powered-by header removal ───────────────────────────────────────────────
  poweredByHeader: false,

  // ── Security headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unused browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Strict transport security (HTTPS only, 1 year)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // XSS protection (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    // Allow images from these domains (add more as needed)
    remotePatterns: [
      { protocol: "https", hostname: "tsdr.uspto.gov" },
      { protocol: "https", hostname: "markitnow.ai" },
    ],
    // Use modern formats
    formats: ["image/avif", "image/webp"],
  },

  // ── Redirect trailing slashes for SEO consistency ───────────────────────────
  trailingSlash: false,
};

module.exports = nextConfig;
