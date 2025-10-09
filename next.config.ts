import type { NextConfig } from "next";

import "./src/env/client"
import "./src/env/server"


const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
