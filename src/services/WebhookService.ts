// services/WebhookService.ts
import Stripe from "stripe";
import { userRepository } from "../repositories/userRepository";

export class WebhookService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await this.handleSubscriptionEvent(
          event.data.object as Stripe.Subscription
        );
        break;

      case "payment_intent.succeeded":
        await this.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
    }
  }

  private async handleSubscriptionEvent(subscription: Stripe.Subscription) {
    // Atualizar status da assinatura do usuário
    const user = await userRepository.findOne({
      where: {
        config: { stripe_customer_id: subscription.customer as string },
      },
      relations: ["config"],
    });

    if (user) {
      // Lógica para atualizar status da assinatura
    }
  }

  private async handlePaymentSuccess(payment: Stripe.PaymentIntent) {
    // Registrar compra avulsa bem-sucedida
    const user = await userRepository.findOne({
      where: { config: { stripe_customer_id: payment.customer as string } },
      relations: ["config"],
    });

    if (user && payment.metadata.product_id) {
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // Vincular customer_id ao usuário após primeira compra
    const user = await userRepository.findOneBy({
      id: session.client_reference_id!,
    });

    if (user && session.customer) {
      await userRepository.manager
        .getRepository("user_configs")
        .update(
          { user: { id: user.id } },
          { stripe_customer_id: session.customer as string }
        );
    }
  }
}
