import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a SERVICE ROLE KEY — bypassa RLS por completo.
 *
 * Exceção deliberada à regra geral do projeto ("service role key nunca
 * entra no código da aplicação", ver comentário em lib/supabase/server.ts):
 * o webhook do Mercado Pago (app/api/webhooks/mercadopago/route.ts) e a
 * confirmação de pagamento no retorno do checkout rodam SEM sessão de
 * usuário (é o Mercado Pago, ou um redirect de servidor, chamando nosso
 * servidor) — não há cookie de auth pra usar o cliente anon normal, e
 * aprovar/rejeitar um pagamento não pode depender da policy de RLS de um
 * usuário comum mesmo.
 *
 * Nunca importar este arquivo de um Server Action acionado diretamente
 * por formulário de usuário, nem de nada que rode no bundle do cliente —
 * só de rotas server-only que verificam a origem da chamada (webhook
 * assinado, ou o próprio servidor confirmando com a API do Mercado Pago).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária pro webhook de pagamento funcionar.",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
