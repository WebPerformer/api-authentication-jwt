import { Request, Response } from "express";
import Stripe from "stripe";

export class ProductsController {
  async getProducts(req: Request, res: Response) {
    try {
      const { limit, active } = req.query;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-09-30.clover",
      });

      const products = await stripe.products.list({
        limit: limit ? parseInt(limit as string) : 100,
        active: active ? active === "true" : undefined,
        expand: ["data.default_price"],
      });

      const formattedProducts = products.data.map((product) => {
        const price = product.default_price as Stripe.Price;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          created: product.created,
          price: {
            id: price?.id,
            type: price?.type,
            unit_amount: price?.unit_amount,
            currency: price?.currency,
            recurring: price?.recurring,
          },
        };
      });

      return res.json({
        success: true,
        data: formattedProducts,
        has_more: products.has_more,
      });
    } catch (error: any) {
      console.error("Error fetching Stripe products:", error);

      if (error.type && error.type.startsWith("Stripe")) {
        return res.status(400).json({
          success: false,
          error: `Stripe error: ${error.message}`,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
