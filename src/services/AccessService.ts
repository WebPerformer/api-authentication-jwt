import Stripe from "stripe";
import { userRepository } from "../repositories/userRepository";

export class AccessService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async canUseTemplate(
    userId: string,
    templateStripeId: string
  ): Promise<boolean> {
    try {
      // 1. Buscar template no Stripe para pegar o tier
      const template = await this.stripe.products.retrieve(templateStripeId);
      const templateTier = template.metadata.tier; // "basic", "professional" ou "premium"

      // 2. Buscar compras/assinaturas ativas do usuário
      const activePurchases = await this.getUserActivePurchases(userId);

      // 3. Aplicar lógica de verificação
      const canAccess = activePurchases.some((purchase) => {
        if (
          purchase.type === "one_time" &&
          purchase.productId === templateStripeId
        )
          return true;

        if (purchase.type === "subscription") {
          const userTier = purchase.productTier;
          if (!userTier) return false;

          // Hierarquia de tiers
          const tierLevels: Record<string, number> = {
            basic: 1,
            professional: 2,
            premium: 3,
          };

          const userLevel = tierLevels[userTier] || 0;
          const templateLevel = tierLevels[templateTier] || 0;

          // Usuário pode acessar se o tier da assinatura for >= do tier do template
          return userLevel >= templateLevel;
        }

        return false;
      });

      return canAccess;
    } catch (error) {
      console.error("Error checking template access:", error);
      return false;
    }
  }

  async hasAnyActivePurchase(userId: string): Promise<boolean> {
    const activePurchases = await this.getUserActivePurchases(userId);
    return activePurchases.length > 0;
  }

  private async getUserActivePurchases(userId: string): Promise<
    Array<{
      type: "subscription" | "one_time";
      productId: string;
      productTier?: string;
    }>
  > {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["config"],
    });

    if (!user?.config?.stripe_customer_id) {
      return [];
    }

    const purchases: Array<{
      type: "subscription" | "one_time";
      productId: string;
      productTier?: string;
    }> = [];

    // Buscar assinaturas ativas
    const subscriptions = await this.stripe.subscriptions.list({
      customer: user.config.stripe_customer_id,
      status: "active",
      // Avoid exceeding Stripe's max expansion depth by stopping at price
      expand: ["data.items.data.price"],
    });

    for (const subscription of subscriptions.data) {
      for (const item of subscription.items.data) {
        const price = item.price as Stripe.Price;
        let productId: string;
        let productTier: string | undefined;

        if (typeof price.product === "string") {
          productId = price.product;

          const product = await this.stripe.products.retrieve(productId);
          if (!("deleted" in product) || !product.deleted) {
            productTier = product.metadata?.tier;
          }
        } else {
          productId = price.product.id;

          if (!("deleted" in price.product) || !price.product.deleted) {
            productTier = (price.product as Stripe.Product).metadata?.tier;
          }
        }

        purchases.push({
          type: "subscription",
          productId,
          productTier,
        });
      }
    }

    // Buscar compras avulsas (one-time)
    const oneTimePayments = await this.stripe.paymentIntents.list({
      customer: user.config.stripe_customer_id,
      limit: 100,
    });

    for (const payment of oneTimePayments.data) {
      if (payment.status === "succeeded" && payment.metadata.product_id) {
        purchases.push({
          type: "one_time",
          productId: payment.metadata.product_id,
        });
      }
    }

    return purchases;
  }
}
