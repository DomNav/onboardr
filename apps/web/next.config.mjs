import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(cfg) {
    cfg.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return cfg;
  },
};

export default nextConfig;