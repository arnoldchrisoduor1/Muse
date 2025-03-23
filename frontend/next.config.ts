/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['robohash.org', 'kenyamall.s3.amazonaws.com'],
  },
  typescript: {
    // This will ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig