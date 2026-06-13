// ── Subscription plan pricing (INR) ──────────────────────────────────────────
// Prices are now set per-restaurant (lunch_price, dinner_price columns).
// These fallback constants are only used when restaurant prices are unavailable.

export const PRICE_ONE_SLOT   = 1_500;
export const PRICE_BOTH_SLOTS = 3_000;

/**
 * Returns the plan price for the selected slots using per-restaurant prices.
 * Falls back to ₹1,500/slot if prices are not provided.
 */
export function calcPlanPrice(
  slots: string[],
  lunchPrice: number = PRICE_ONE_SLOT,
  dinnerPrice: number = PRICE_ONE_SLOT,
): number {
  let total = 0;
  if (slots.includes("lunch"))  total += lunchPrice;
  if (slots.includes("dinner")) total += dinnerPrice;
  return total > 0 ? total : PRICE_ONE_SLOT;
}

// ── Demo payment stub ─────────────────────────────────────────────────────────
//
// TO SWAP IN A REAL PAYMENT GATEWAY (Razorpay / Stripe / PhonePe):
//
//   Step 1 — Create a payment order server-side and return { ok: true, orderId }
//   Step 2 — Pass orderId to the client; open the gateway SDK modal there
//   Step 3 — After the user completes payment, call your webhook / verify endpoint
//   Step 4 — Only on successful verification, call createSubscription() /
//             renewSubscription() with the returned paymentId
//
//   The call site in src/app/subscriptions/actions.ts passes amountINR, studentId,
//   and metadata — everything a gateway order needs.
//
// For now this returns { ok: true } instantly. No money moves.
// ─────────────────────────────────────────────────────────────────────────────
export async function processDemoPayment(
  _amountINR: number,
  _studentId: string,
  _metadata: Record<string, unknown>
): Promise<{ ok: boolean; paymentId?: string; error?: string }> {
  // TODO: replace this body with a real gateway call
  return { ok: true, paymentId: `demo_${Date.now()}` };
}
