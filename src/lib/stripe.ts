import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Bond amount: AUD $500 = 50000 cents
export const BOND_AMOUNT = 50000;

// Convert dollars to cents for Stripe
export const toCents = (amount: number) => Math.round(amount * 100);
