import Stripe from 'stripe';
import { getUncachableStripeClient, getStripeWebhookSecret, getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error('Invalid payload format');
    }

    const webhookSecret = await getStripeWebhookSecret();
    
    if (webhookSecret) {
      const stripe = await getUncachableStripeClient();
      let event: Stripe.Event;
      
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch {
        throw new Error('Webhook signature verification failed');
      }

      if (event.type === 'payment_intent.succeeded') {
        await WebhookHandlers.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      } else {
        console.warn(`[Webhook] Ignoring event type: ${event.type}`);
      }
    } else {
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
    }
  }

  static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const applicationId = paymentIntent.metadata?.applicationId;
    const userId = paymentIntent.metadata?.userId;
    const listingId = paymentIntent.metadata?.listingId;
    const paymentIntentId = paymentIntent.id;

    if (!applicationId || !userId) {
      console.warn('[Webhook] Missing required metadata: applicationId or userId');
      return;
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application) {
      console.warn(`[Webhook] Application not found: ${applicationId}`);
      return;
    }

    if (listingId && application.listingId !== listingId) {
      throw new Error(`Metadata mismatch: listingId ${listingId} does not match application listingId ${application.listingId}`);
    }

    if (application.status !== 'approved') {
      console.warn(`[Webhook] Application not approved: ${applicationId}, status: ${application.status}`);
      return;
    }

    let existingPayment = await storage.getPaymentByApplication(applicationId);
    
    if (existingPayment?.status === 'completed') {
      console.warn(`[Webhook] Payment already completed for application: ${applicationId}`);
      return;
    }

    if (application.paymentStatus === 'paid') {
      console.warn(`[Webhook] Application already marked paid: ${applicationId}`);
      return;
    }

    if (existingPayment?.stripeChargeId === paymentIntentId) {
      console.warn(`[Webhook] Duplicate webhook for payment intent: ${paymentIntentId}`);
      return;
    }

    if (existingPayment) {
      await storage.updatePayment(existingPayment.id, {
        status: 'completed',
        stripeChargeId: paymentIntentId,
        completedAt: new Date(),
      });
    } else {
      existingPayment = await storage.createPayment({
        applicationId,
        userId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'completed',
        stripeChargeId: paymentIntentId,
        stripePaymentIntentId: paymentIntentId,
        completedAt: new Date(),
      });
    }

    await storage.updateApplication(applicationId, {
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntentId,
    });

    await storage.createAuditLog({
      userId,
      action: "payment_completed",
      resourceType: "payment",
      resourceId: existingPayment?.id || paymentIntentId,
      metadata: JSON.stringify({
        applicationId,
        listingId: application.listingId,
        stripePaymentIntentId: paymentIntentId,
        amount: paymentIntent.amount,
        completedAt: new Date().toISOString(),
      }),
    } as any);
  }

  static async handleCheckoutComplete(_session: any): Promise<void> {
    console.warn('[Webhook] handleCheckoutComplete called - no-op, payment_intent.succeeded is the source of truth');
  }

  static async handlePaymentFailed(_session: any): Promise<void> {
    console.warn('[Webhook] handlePaymentFailed called - logging only, no state changes');
  }
}
