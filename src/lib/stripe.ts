import Stripe from 'stripe';

// Lazy singleton — only instantiated when first called (not at module load time)
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

// Bond amount: AUD $500 = 50000 cents
export const BOND_AMOUNT = 50000;

// Convert dollars to cents for Stripe
export const toCents = (amount: number) => Math.round(amount * 100);
