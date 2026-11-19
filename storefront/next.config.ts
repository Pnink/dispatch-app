import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/pricing", destination: "/costs", permanent: true }];
  },
};

export default nextConfig;
