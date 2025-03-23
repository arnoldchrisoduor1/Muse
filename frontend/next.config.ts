/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['robohash.org', 'kenyamall.s3.amazonaws.com'],
  },
}

module.exports = nextConfig