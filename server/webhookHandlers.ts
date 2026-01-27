import { getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }

  static async handleCheckoutComplete(session: any): Promise<void> {
    const applicationId = session.metadata?.applicationId;
    const userId = session.metadata?.userId;
    const listingId = session.metadata?.listingId;

    if (applicationId && userId) {
      // IDEMPOTENCY GUARD: Check if payment already processed
      const existingPayment = await storage.getPaymentByApplication(applicationId);
      if (existingPayment?.status === 'completed') {
        console.log(`[Webhook] Duplicate webhook ignored - payment already completed for application ${applicationId}`);
        return; // Already processed, exit early (Stripe sends duplicates)
      }

      // Also check application payment status as a secondary guard
      const application = await storage.getApplicationById(applicationId);
      if (application?.paymentStatus === 'paid') {
        console.log(`[Webhook] Duplicate webhook ignored - application ${applicationId} already paid`);
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

      // Audit log: Payment completed
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

      // Audit log: Payment failed
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
