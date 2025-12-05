import { Request, Response } from "express";
import Stripe from "stripe";
import { userRepository } from "../repositories/userRepository";

export class SubscriptionController {
  /**
   * Troca a assinatura Stripe de um usuário (upgrade/downgrade)
   * Espera BODY: { current_price_id, new_price_id }
   * Usuário autenticado (req.user), assume que user.config existe
   */
  async changeSubscription(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const userId = req.user.id;
      const { current_price_id, new_price_id } = req.body;

      if (!userId || !current_price_id || !new_price_id) {
        return res
          .status(400)
          .json({ error: "Parâmetros obrigatórios ausentes." });
      }

      // Recupera usuário + config + stripe_customer_id
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });
      if (!user || !user.config?.stripe_customer_id) {
        return res
          .status(404)
          .json({ error: "Stripe customer não cadastrado para usuário." });
      }

      // Busca assinatura ativa Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: user.config.stripe_customer_id,
        status: "active",
        limit: 1,
      });
      if (!subscriptions.data.length) {
        return res
          .status(404)
          .json({ error: "Assinatura ativa não encontrada no Stripe." });
      }
      const subscription = subscriptions.data[0];

      // Altera preço do primeiro item (upgrade/downgrade)
      const updated = await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: new_price_id,
          },
        ],
        proration_behavior: "create_prorations",
      });

      return res.json({ success: true, subscription: updated });
    } catch (error: any) {
      console.error("Erro ao mudar assinatura:", error);
      return res
        .status(500)
        .json({ error: error.message || "Erro interno ao mudar assinatura." });
    }
  }

  /**
   * Cancela a assinatura Stripe ativa de um usuário
   * POST /subscriptions/cancel
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const userId = req.user.id;

      // Busca usuário + config (stripe_customer_id)
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });
      if (!user || !user.config?.stripe_customer_id) {
        return res
          .status(404)
          .json({ error: "Stripe customer não cadastrado." });
      }

      // Busca assinatura ativa do usuário
      const subscriptions = await stripe.subscriptions.list({
        customer: user.config.stripe_customer_id,
        status: "active",
        limit: 1,
      });
      if (!subscriptions.data.length) {
        return res
          .status(404)
          .json({ error: "Assinatura ativa não encontrada." });
      }
      const subscription = subscriptions.data[0];

      // Cancela assinatura imediatamente
      const canceled = await stripe.subscriptions.cancel(subscription.id);
      return res.json({ success: true, subscription: canceled });
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error);
      return res.status(500).json({
        error: error.message || "Erro interno ao cancelar assinatura.",
      });
    }
  }
}
