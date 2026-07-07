/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export -> produces ./out, deployable to Cloudflare Pages
  // free tier with zero server/functions cost. All state is client-side
  // (localStorage), so no SSR/ISR/runtime is required.
  output: 'export',

  // Static export cannot use the Next.js image optimizer (needs a server).
  images: {
    unoptimized: true,
  },

  // Emit /route/index.html so Cloudflare Pages resolves nested routes on refresh.
  trailingSlash: true,

  reactStrictMode: true,
};

export default nextConfig;
