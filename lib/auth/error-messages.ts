/**
 * Traduz mensagens de erro do Supabase Auth (GoTrue) para PT-BR.
 *
 * Diferente dos templates de e-mail (editáveis em Authentication >
 * Email Templates no Supabase Dashboard), as mensagens de erro que a
 * API retorna (ex.: rate limit, credenciais inválidas) vêm sempre em
 * inglês e não têm opção de tradução no Dashboard — por isso
 * interceptamos os padrões mais comuns aqui, antes de mostrar pro
 * usuário em /login e /signup. Mensagem não mapeada cai num fallback
 * genérico em vez de vazar o texto em inglês.
 */
export function translateAuthError(message: string, code?: string): string {
  const rateLimitMatch = message.match(/after (\d+) seconds?/i);
  if (rateLimitMatch) {
    return `Por segurança, só é possível tentar de novo em ${rateLimitMatch[1]} segundos.`;
  }

  if (code === "user_already_exists" || message.includes("already registered")) {
    return "Já existe uma conta com esse e-mail. Tente entrar.";
  }

  if (message.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (message.includes("Email not confirmed")) {
    return "Confirme seu e-mail antes de entrar — verifique sua caixa de entrada (e o spam).";
  }

  if (message.includes("Unable to validate email address")) {
    return "E-mail inválido.";
  }

  if (message.toLowerCase().includes("password")) {
    return "A senha não atende aos requisitos mínimos.";
  }

  return "Não foi possível concluir. Tente novamente em instantes.";
}
