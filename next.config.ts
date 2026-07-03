import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Lint legado (any nos templates demo etc.) não bloqueia o deploy;
    // o type-check do TypeScript continua rodando no build.
    ignoreDuringBuilds: true,
  },
  // Strict Mode monta/desmonta os componentes 2x em dev (só em dev) pra
  // detectar efeitos sem cleanup. Isso derruba os listeners onSnapshot do
  // Firestore quase instantaneamente e expõe um bug conhecido do SDK
  // (@firebase/firestore: "INTERNAL ASSERTION FAILED: Unexpected state") ao
  // trocar de aba rapidamente. Não afeta o build de produção.
  reactStrictMode: false,
}

export default nextConfig
