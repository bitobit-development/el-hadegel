import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fs.knesset.gov.il',
        pathname: '/globaldocs/MK/**',
      },
      {
        // Allow all HTTPS images for Open Graph previews (news posts)
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
