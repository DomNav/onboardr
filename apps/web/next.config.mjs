import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(cfg) {
    cfg.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return cfg;
  },
};

export default nextConfig;