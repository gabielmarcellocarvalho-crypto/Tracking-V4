import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Lint legado (any nos templates demo etc.) não bloqueia o deploy;
    // o type-check do TypeScript continua rodando no build.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
