import { Request, Response } from "express";
import { AccessService } from "../services/AccessService";
import Stripe from "stripe";

export class TemplateController {
  async getTemplates(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { tier, limit } = req.query;

      const accessService = new AccessService();
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      // Buscar produtos E prices separadamente
      const [products, prices] = await Promise.all([
        stripe.products.list({
          limit: limit ? parseInt(limit as string) : 100,
          active: true,
        }),
        stripe.prices.list({
          limit: 100,
          active: true,
        }),
      ]);

      // Formatar templates combinando produtos com seus prices
      const templates = await Promise.all(
        products.data.map(async (product) => {
          // 👇 ENCONTRAR O PRICE CORRETO PARA ESTE PRODUTO
          const productPrices = prices.data.filter(
            (price) => price.product === product.id
          );
          const defaultPrice =
            productPrices.find((price) => price.id === product.default_price) ||
            productPrices[0];

          const hasAccess = await accessService.canUseTemplate(
            userId!,
            product.id
          );

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images,
            metadata: product.metadata,
            tier: product.metadata.tier,
            has_access: hasAccess,
            price: defaultPrice
              ? {
                  id: defaultPrice.id, // 👈 AGORA SEMPRE SERÁ O PRICE CORRETO
                  type: defaultPrice.type,
                  unit_amount: defaultPrice.unit_amount,
                  currency: defaultPrice.currency,
                  recurring: defaultPrice.recurring,
                }
              : null,
          };
        })
      );

      // Filtrar por tier se especificado
      const filteredTemplates = tier
        ? templates.filter((template) => template.tier === tier)
        : templates;

      return res.json({
        success: true,
        data: filteredTemplates,
      });
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getTemplateById(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const accessService = new AccessService();
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const product = await stripe.products.retrieve(id, {
        expand: ["default_price"],
      });

      const price = product.default_price as Stripe.Price;
      const hasAccess = await accessService.canUseTemplate(userId!, id);

      const template = {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        tier: product.metadata.tier,
        has_access: hasAccess,
        price: price
          ? {
              id: price.id,
              type: price.type,
              unit_amount: price.unit_amount,
              currency: price.currency,
              recurring: price.recurring,
            }
          : null,
      };

      return res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error("Error fetching template:", error);

      if (error.type === "StripeInvalidRequestError") {
        return res.status(404).json({
          success: false,
          error: "Template not found",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
