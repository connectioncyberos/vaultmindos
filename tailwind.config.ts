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
        // TODO(design): paleta de marca ainda nao definida no Visual
        // Language v1.0 (o documento nomeia "Cor" como pilar, sem hex).
        // Tokens semanticos de estado ja preparados (secao 19 do
        // Visual Language: Normal/Hover/Focus/Active/Disabled/Loading/
        // Success/Warning/Error/Empty) — mapear para hex quando a
        // paleta oficial for definida.
        state: {
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
          info: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
