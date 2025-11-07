import { Request, Response } from "express";
import { WebhookService } from "../services/WebhookService";
import Stripe from "stripe";

export class WebhookController {
  async handleWebhook(req: Request, res: Response) {
    const webhookService = new WebhookService();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      // Usar rawBody em vez de req.body
      const event = stripe.webhooks.constructEvent(
        req.rawBody || req.body, // Dependendo da sua configuração
        sig,
        webhookSecret
      );

      await webhookService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}
