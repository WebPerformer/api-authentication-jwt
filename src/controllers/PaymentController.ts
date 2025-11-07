import { Request, Response } from "express";
import Stripe from "stripe";
import { userRepository } from "../repositories/userRepository";

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const { price_id, mode = "payment", product_id } = req.body;
      const userId = req.user.id;

      // Buscar usuário para pegar customer_id
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });

      let customerId = user?.config?.stripe_customer_id;

      if (!customerId) {
        const customerParams: Stripe.CustomerCreateParams = {
          metadata: {
            user_id: String(userId),
          },
        };
        if (user?.email) {
          customerParams.email = user.email;
        }
        if (user?.username) {
          customerParams.name = user.username;
        }
        const customer = await stripe.customers.create(customerParams);
        customerId = customer.id;

        // 👇 CORRIGIR A FORMA DE SALVAR NO BANCO
        if (user) {
          // Verificar se já existe UserConfig
          let userConfig = await userRepository.manager
            .getRepository("user_configs")
            .findOne({ where: { user: { id: userId } } });

          if (!userConfig) {
            // Criar UserConfig se não existir
            userConfig = userRepository.manager
              .getRepository("user_configs")
              .create({
                user: user,
                stripe_customer_id: customerId,
              });
          } else {
            // Atualizar se já existir
            userConfig.stripe_customer_id = customerId;
          }

          await userRepository.manager
            .getRepository("user_configs")
            .save(userConfig);
          console.log("✅ Customer ID saved to database:", customerId);
        }
      }

      let intent;
      let clientSecret;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Customer ID is required",
        });
      }

      if (mode === "payment") {
        // 👇 PAYMENT INTENT para compra única
        // Buscar o preço para pegar o amount
        const price = await stripe.prices.retrieve(price_id);

        if (!price.unit_amount) {
          return res.status(400).json({
            success: false,
            error: "Price amount is required",
          });
        }

        intent = await stripe.paymentIntents.create({
          amount: price.unit_amount,
          currency: price.currency,
          customer: customerId,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            user_id: userId,
            ...(product_id && { product_id }),
            type: "one_time",
          },
        });
        clientSecret = intent.client_secret;
      } else {
        // 👇 SETUP INTENT para assinatura
        intent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ["card"],
          metadata: {
            user_id: userId,
            ...(price_id && { price_id }),
            ...(product_id && { product_id }),
            type: "subscription",
          },
        });
        clientSecret = intent.client_secret;
      }

      return res.json({
        success: true,
        client_secret: clientSecret,
        customer_id: customerId,
        intent_type: mode,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // PaymentController.ts - Modificar o método createSubscription

  async createSubscription(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const { price_id, payment_method_id, product_id } = req.body;
      const userId = req.user.id;

      // 👇 VALIDAÇÃO do price_id
      if (!price_id || !price_id.startsWith("price_")) {
        return res.status(400).json({
          success: false,
          error: "Invalid price ID",
        });
      }

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });

      if (!user?.config?.stripe_customer_id) {
        return res.status(400).json({
          success: false,
          error: "Customer not found",
        });
      }

      const customerId = user.config.stripe_customer_id;

      // 👇 ANEXAR payment method ao customer
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });

      // 👇 DEFINIR como payment method padrão
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });

      // 👇 VERIFICAR SE JÁ EXISTE ASSINATURA ATIVA
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      let subscription;

      if (existingSubscriptions.data.length > 0) {
        // 👇 FAZER UPGRADE da assinatura existente
        const existingSubscription = existingSubscriptions.data[0];

        subscription = await stripe.subscriptions.update(
          existingSubscription.id,
          {
            items: [
              {
                id: existingSubscription.items.data[0].id, // ID do item atual
                price: price_id, // Novo price
              },
            ],
            proration_behavior: "create_prorations", // Ajuste proporcional
            metadata: {
              user_id: userId,
              ...(product_id && { product_id }),
              upgraded_from: existingSubscription.items.data[0].price.id, // Registrar upgrade
            },
            expand: ["latest_invoice.payment_intent"],
          }
        );

        console.log(
          `🔄 Subscription upgraded from ${existingSubscription.items.data[0].price.id} to ${price_id}`
        );
      } else {
        // 👇 CRIAR NOVA ASSINATURA (usuário não tinha nenhuma)
        subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: price_id }],
          metadata: {
            user_id: userId,
            ...(product_id && { product_id }),
          },
          expand: ["latest_invoice.payment_intent"],
        });

        console.log(`✅ New subscription created: ${subscription.id}`);
      }

      return res.json({
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        // 👇 INFORMAR SE FOI UPGRADE OU NOVA ASSINATURA
        action: existingSubscriptions.data.length > 0 ? "upgraded" : "created",
      });
    } catch (error: any) {
      console.error("Error in createSubscription:", error);

      if (error.code === "resource_missing") {
        return res.status(400).json({
          success: false,
          error: `Stripe resource not found: ${error.message}`,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async confirmOneTimePayment(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const { payment_intent_id } = req.body;
      const userId = req.user.id;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        payment_intent_id
      );

      if (paymentIntent.status === "succeeded") {
        // Registrar compra avulsa bem-sucedida
        return res.json({
          success: true,
          message: "Payment completed successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Payment not completed",
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
