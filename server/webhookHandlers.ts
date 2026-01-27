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

    if (applicationId && userId) {
      await storage.updatePayment(session.id, {
        status: 'completed',
        stripeChargeId: session.payment_intent,
        completedAt: new Date(),
      });

      await storage.updateApplication(applicationId, {
        paymentStatus: 'paid',
        stripePaymentIntentId: session.payment_intent,
      });
    }
  }
}
