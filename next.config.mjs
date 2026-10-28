/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Use in-memory cache in development to eliminate .pack.gz file-locking and ENOENT crashes
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
};

export default nextConfig;
