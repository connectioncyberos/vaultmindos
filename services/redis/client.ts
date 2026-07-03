/**
 * Redis (Modulo 9) — preparado pra cache/filas futuros. Sem REDIS_URL
 * configurada, get/set viram no-ops seguros (cache sempre "miss") em
 * vez de quebrar quem chamar. Sem SDK instalado de proposito (ver
 * nota em services/resend/client.ts) — quando for ligado de verdade,
 * trocar por @upstash/redis ou ioredis conforme o provedor escolhido.
 */

export const isRedisConfigured = Boolean(process.env.REDIS_URL);

export async function cacheGet<T = unknown>(_key: string): Promise<T | null> {
  if (!isRedisConfigured) return null;
  // TODO(Modulo futuro): implementar client real quando REDIS_URL existir.
  return null;
}

export async function cacheSet(_key: string, _value: unknown, _ttlSeconds?: number): Promise<void> {
  if (!isRedisConfigured) return;
  // TODO(Modulo futuro): implementar client real quando REDIS_URL existir.
}
