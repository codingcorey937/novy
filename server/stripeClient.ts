import Stripe from 'stripe';

// simple helpers that pull from standard environment variables

export function getUncachableStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not defined');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export function getStripePublishableKey() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('STRIPE_PUBLISHABLE_KEY not defined');
  }
  return publishableKey;
}

export function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not defined');
  }
  return secretKey;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

// optional sync functionality; stubbed when not configured
export async function getStripeSync() {
  throw new Error('Stripe sync not configured');
}
