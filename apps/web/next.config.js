/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@25pagescript/shared'],
  webpack: (config) => {
    // Required for react-pdf
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
