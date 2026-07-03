/**
 * Meilisearch (Modulo 9) — preparado pra busca avancada futura. Sem
 * MEILISEARCH_HOST configurado, `search` retorna lista vazia em vez
 * de quebrar — a busca de verdade so entra num modulo futuro; ate
 * la, a navegacao por dominio/cluster (Modulo 6) cobre a descoberta
 * de conteudo.
 */

export const isMeilisearchConfigured = Boolean(process.env.MEILISEARCH_HOST);

export async function search<T = unknown>(_query: string): Promise<T[]> {
  if (!isMeilisearchConfigured) return [];
  // TODO(Modulo futuro): implementar chamada real quando MEILISEARCH_HOST existir.
  return [];
}
