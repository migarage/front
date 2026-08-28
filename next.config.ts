import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "motos.honda.cl",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "www.honda.cl",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
