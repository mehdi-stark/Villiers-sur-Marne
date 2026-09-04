import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Les documents de pilotage sont lus sur le disque au runtime (docs/planning).
  transpilePackages: ["@ville/core"],
  outputFileTracingIncludes: { "/pilotage/**": ["../../docs/planning/**"], "/": ["../../docs/planning/**"] },
};
export default config;
