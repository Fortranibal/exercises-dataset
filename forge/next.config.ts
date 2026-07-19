import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root (multiple lockfiles exist higher in the tree).
  turbopack: {
    root: path.resolve(),
  },
  // Exercise media (1,324 JPGs + GIFs) is served directly from /public symlinks.
  // Disable the image optimizer so GIFs keep animating and dev stays fast.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
