/**
 * Stripe (Modulo 9) — preparado, checkout desativado no MVP. Nenhuma
 * chamada de API real ainda; existe so pra a pasta/contrato de codigo
 * ja estar no lugar quando o checkout for ligado num modulo futuro.
 * Sem SDK instalado de proposito (ver nota em services/resend/client.ts).
 */

export const CHECKOUT_ENABLED = false;

export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

/** Placeholder — lanca se alguem tentar usar antes do checkout ser ligado. */
export async function createCheckoutSession(): Promise<never> {
  throw new Error(
    "Checkout Stripe desativado no MVP (CHECKOUT_ENABLED=false). Ver Modulo 9 do roadmap.",
  );
}
