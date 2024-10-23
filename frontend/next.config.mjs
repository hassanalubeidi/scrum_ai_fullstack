/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ai/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'data',
        hostname: '*',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
