/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    proxyClientMaxBodySize: '20mb',
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
