// ── Subscription plan pricing (INR) ──────────────────────────────────────────
// Edit ONLY here to change prices everywhere — SubscribePanel, RenewPanel,
// and the subscription server actions all import from this module.

export const PRICE_ONE_SLOT   = 1_500;   // lunch-only OR dinner-only (30 tokens)
export const PRICE_BOTH_SLOTS = 3_000;   // lunch + dinner             (60 tokens)

/** Returns the 30-day plan price for the given slot selection. */
export function calcPlanPrice(slots: string[]): number {
  return slots.length >= 2 ? PRICE_BOTH_SLOTS : PRICE_ONE_SLOT;
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
