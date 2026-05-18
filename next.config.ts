import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/blog/contraseñas-reutilizadas",
        destination: "/blog/contrasenas-reutilizadas",
        permanent: true,
      },
      {
        source: "/blog/contrase%C3%B1as-reutilizadas",
        destination: "/blog/contrasenas-reutilizadas",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
