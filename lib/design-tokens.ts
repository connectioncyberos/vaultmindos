/**
 * VaultMindOS — Design Tokens
 * Fonte: Visual Language v1.0 (docs/blueprint/origem-do-projeto-v1.md, Entrada 3)
 *
 * Estes tokens sao a traducao em codigo da gramatica visual de 5 pilares
 * (Forma, Espaco, Cor, Tipografia, Movimento). Qualquer componente novo
 * deve usar estes valores — nunca numeros soltos no meio do JSX/CSS.
 */

/** Escala de espacamento oficial. Nunca usar valores fora dela. */
export const spacing = {
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
  "4xl": "64px",
  "5xl": "96px",
  "6xl": "128px",
} as const;

/**
 * Hierarquia fixa de toda tela (Visual Language, secao 4):
 * Contexto -> Titulo Principal -> Descricao -> Acao Principal ->
 * Conteudo -> Conteudo Relacionado -> Acoes Secundarias.
 * O usuario nunca deve "procurar" o elemento principal da pagina.
 */
export const pageSectionOrder = [
  "context",
  "title",
  "description",
  "primaryAction",
  "content",
  "relatedContent",
  "secondaryActions",
] as const;

/** Estados visuais obrigatorios para todo elemento interativo (secao 19). */
export const interactiveStates = [
  "normal",
  "hover",
  "focus",
  "active",
  "disabled",
  "loading",
  "success",
  "warning",
  "error",
  "empty",
] as const;

/**
 * Os quatro conceitos que toda interface precisa comunicar de imediato
 * (Visual Language, secao 2 — Principio Fundamental). Usar como checklist
 * de revisao de design, nao como token de codigo.
 */
export const principiosFundamentais = [
  "Inteligência",
  "Organização",
  "Confiabilidade",
  "Evolução",
] as const;
