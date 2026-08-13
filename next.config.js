/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for Capacitor/Android builds (set via env in GitHub Actions)
  ...(process.env.CAPACITOR_BUILD === 'true' ? { output: 'export' } : {}),
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
