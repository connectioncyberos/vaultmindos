import type { Config } from "tailwindcss";

// Escala de espaçamento oficial — Visual Language v1.0 (Entrada 3,
// docs/blueprint/origem-do-projeto-v1.md). Nunca usar valores fora dela.
// 1=4px 2=8px 3=12px 4=16px 5=24px 6=32px 7=48px 8=64px 9=96px 10=128px
const spacingScale = {
  "0": "0px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "24px",
  "6": "32px",
  "7": "48px",
  "8": "64px",
  "9": "96px",
  "10": "128px",
};

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    // Substitui (nao estende) a escala padrao do Tailwind — so os 10
    // valores aprovados existem como utilitario de espacamento.
    spacing: spacingScale,
    extend: {
      colors: {
        // Enterprise Emerald — paleta de marca oficial do VaultMindOS
        // (docs/blueprint/vaultmindos-academy-architecture-v1.md e
        // docs/blueprint/origem-do-projeto-v1.md). Usa as escalas
        // nativas do Tailwind (neutral-950/emerald-500/600) como base
        // de fundo/marca — sem tokens customizados pra isso, ja que os
        // valores documentados batem exatamente com o padrao do
        // Tailwind. Tokens semanticos de estado alinhados a marca:
        state: {
          success: "#10b981",
          warning: "#d97706",
          error: "#ef4444",
          info: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
