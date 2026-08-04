import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Für das Docker-Deployment (Coolify o.ä. statt Vercel): eigenständiger
  // Server-Build mit minimalen node_modules im Image.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
