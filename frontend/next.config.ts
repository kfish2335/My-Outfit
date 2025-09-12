/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',               // ← this replaces `next export`
  images: { unoptimized: true },  // if you used next/image
  trailingSlash: true,            // so /generate and /generate/ both work
};
module.exports = nextConfig;
