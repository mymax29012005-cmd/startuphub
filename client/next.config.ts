import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Монорепозиторий: корень с lockfile — чтобы Next не путал workspace (см. предупреждение в логах). */
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:4000/api/:path*" },
      { source: "/uploads/:path*", destination: "http://127.0.0.1:4000/uploads/:path*" },
    ];
  },
};

export default nextConfig;
