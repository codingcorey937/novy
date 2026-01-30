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

    if (!applicationId || !userId) {
      return;
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application) {
      return;
    }

    if (application.status !== 'approved') {
      return;
    }

    if (application.paymentStatus === 'paid') {
      return;
    }

    const existingPayment = await storage.getPaymentByApplication(applicationId);
    if (existingPayment?.status === 'completed') {
      return;
    }

    if (existingPayment) {
      await storage.updatePayment(existingPayment.id, {
        status: 'completed',
        stripeChargeId: paymentIntent.id,
        completedAt: new Date(),
      });
    }

    await storage.updateApplication(applicationId, {
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntent.id,
    });

    await storage.createAuditLog({
      userId,
      action: "payment_completed",
      resourceType: "payment",
      resourceId: existingPayment?.id || paymentIntent.id,
      metadata: JSON.stringify({
        applicationId,
        listingId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        completedAt: new Date().toISOString(),
      }),
    } as any);
  }

  static async handleCheckoutComplete(session: any): Promise<void> {
    const applicationId = session.metadata?.applicationId;
    const userId = session.metadata?.userId;
    const listingId = session.metadata?.listingId;

    if (applicationId && userId) {
      const existingPayment = await storage.getPaymentByApplication(applicationId);
      if (existingPayment?.status === 'completed') {
        return;
      }

      const application = await storage.getApplicationById(applicationId);
      if (application?.paymentStatus === 'paid') {
        return;
      }
      
      await storage.updatePayment(session.id, {
        status: 'completed',
        stripeChargeId: session.payment_intent,
        completedAt: new Date(),
      });

      await storage.updateApplication(applicationId, {
        paymentStatus: 'paid',
        stripePaymentIntentId: session.payment_intent,
      });

      await storage.createAuditLog({
        userId,
        action: "payment_completed",
        resourceType: "payment",
        resourceId: existingPayment?.id || session.id,
        metadata: JSON.stringify({
          applicationId,
          listingId,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          amount: session.amount_total,
          completedAt: new Date().toISOString(),
        }),
      } as any);
    }
  }

  static async handlePaymentFailed(session: any): Promise<void> {
    const applicationId = session.metadata?.applicationId;
    const userId = session.metadata?.userId;
    const listingId = session.metadata?.listingId;

    if (applicationId && userId) {
      const existingPayment = await storage.getPaymentByApplication(applicationId);

      await storage.createAuditLog({
        userId,
        action: "payment_failed",
        resourceType: "payment",
        resourceId: existingPayment?.id || session.id,
        metadata: JSON.stringify({
          applicationId,
          listingId,
          stripeSessionId: session.id,
          failedAt: new Date().toISOString(),
        }),
      } as any);
    }
  }
}
