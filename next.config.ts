import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
