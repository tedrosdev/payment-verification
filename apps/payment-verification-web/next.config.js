/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@payment-verification/types', '@payment-verification/config'],
  reactStrictMode: true,
};

module.exports = nextConfig;
