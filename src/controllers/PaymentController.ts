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

        // CORRIGIR A FORMA DE SALVAR NO BANCO
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
        // PAYMENT INTENT para compra única
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
        // SETUP INTENT para assinatura
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

      // VALIDAÇÃO do price_id
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

      // ANEXAR payment method ao customer
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });

      // DEFINIR como payment method padrão
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });

      // VERIFICAR SE JÁ EXISTE ASSINATURA ATIVA OU EM TRIAL
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all", // Buscar todas para filtrar manualmente
        limit: 10, // Aumentar limite para buscar mais assinaturas
      });

      // Filtrar apenas assinaturas ativas ou em trial
      const validSubscriptions = existingSubscriptions.data.filter(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );

      let subscription;

      if (validSubscriptions.length > 0) {
        // FAZER UPGRADE da assinatura existente
        const existingSubscription = validSubscriptions[0];

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
      } else {
        // CRIAR NOVA ASSINATURA (usuário não tinha nenhuma)
        // Verificar se é assinatura básica para aplicar trial
        const price = await stripe.prices.retrieve(price_id);
        const product = await stripe.products.retrieve(price.product as string);
        const isBasicTier = product.metadata?.tier === "basic";

        const subscriptionParams: Stripe.SubscriptionCreateParams = {
          customer: customerId,
          items: [{ price: price_id }],
          metadata: {
            user_id: userId,
            ...(product_id && { product_id }),
          },
          expand: ["latest_invoice.payment_intent"],
        };

        // Verificar se o usuário já usou o trial antes
        // Buscar TODAS as assinaturas do cliente (incluindo canceladas/expiradas)
        const allSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "all", // Buscar todas: active, canceled, past_due, etc.
          limit: 100,
        });

        // Verificar se alguma assinatura anterior teve trial
        // Uma assinatura teve trial se:
        // 1. Tem trial_end definido (não null e > 0)
        // 2. Tem trial_start definido (não null e > 0)
        // 3. Status atual é "trialing"
        // 4. Status é "canceled" mas tinha trial_end ou trial_start
        const hasUsedTrialBefore = allSubscriptions.data.some((sub) => {
          const hadTrialEnd = sub.trial_end !== null && sub.trial_end > 0;
          const hadTrialStart = sub.trial_start !== null && sub.trial_start > 0;
          const isTrialing = sub.status === "trialing";
          const wasCanceledWithTrial =
            sub.status === "canceled" && (hadTrialEnd || hadTrialStart);

          return hadTrialEnd || hadTrialStart || isTrialing || wasCanceledWithTrial;
        });

        // Aplicar período de avaliação de 14 dias apenas para assinatura básica
        // E APENAS se o usuário NUNCA usou o trial antes
        if (isBasicTier && !hasUsedTrialBefore) {
          // Usar trial_period_days ao invés de trial_end (mais simples e recomendado)
          subscriptionParams.trial_period_days = 14;
        }

        subscription = await stripe.subscriptions.create(subscriptionParams);
      }

      // Verificar status do pagamento para informar ao frontend
      const latestInvoice =
        subscription.latest_invoice as Stripe.Invoice | null;

      // payment_intent pode ser uma string (ID) ou um objeto expandido
      // Usar indexação porque o TypeScript pode não reconhecer a propriedade
      let paymentIntentStatus: string | null = null;

      if (latestInvoice) {
        const paymentIntentValue = (latestInvoice as any).payment_intent;
        if (paymentIntentValue) {
          // Verificar se é um objeto (expandido) ou string (ID)
          if (
            typeof paymentIntentValue === "object" &&
            "status" in paymentIntentValue
          ) {
            // Se foi expandido, é um objeto PaymentIntent
            paymentIntentStatus = (paymentIntentValue as Stripe.PaymentIntent)
              .status;
          }
          // Se for string, não temos o status sem buscar, mas o status da subscription já indica
        }
      }

      // Determinar se o pagamento está pendente
      const isPaymentPending =
        subscription.status === "incomplete" ||
        subscription.status === "incomplete_expired" ||
        paymentIntentStatus === "requires_action";

      return res.json({
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        // INFORMAR SE FOI UPGRADE OU NOVA ASSINATURA
        action: validSubscriptions.length > 0 ? "upgraded" : "created",
        // Informar se o pagamento está pendente
        payment_pending: isPaymentPending,
        payment_intent_status: paymentIntentStatus,
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

  /**
   * Inicia fluxo de troca de método de pagamento (cartão) - retorna SetupIntent
   * POST /payment/create-setup-intent
   */
  async createSetupIntent(req: Request, res: Response) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const userId = req.user.id;

      // Buscar usuário para pegar customer_id
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });
      const customerId = user?.config?.stripe_customer_id;
      if (!customerId) {
        return res
          .status(400)
          .json({ error: "Cliente Stripe não encontrado." });
      }

      const params: any = {
        payment_method_types: ["card"],
        metadata: { user_id: userId, type: "update_payment_method" },
      };
      if (customerId) params.customer = customerId;
      const intent = await stripe.setupIntents.create(params);

      res.json({ success: true, client_secret: intent.client_secret });
    } catch (error: any) {
      console.error(
        "Erro ao criar SetupIntent para troca de pagamento:",
        error
      );
      res
        .status(500)
        .json({ error: error.message || "Erro interno ao criar SetupIntent." });
    }
  }

  /**
   * Atualiza o método de pagamento principal do usuário (cartão) no Stripe
   * POST /payment/update-payment-method { payment_method_id }
   */
  async updatePaymentMethod(req: Request, res: Response) {
    try {
      const { payment_method_id } = req.body;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const userId = req.user.id;

      if (!payment_method_id) {
        return res
          .status(400)
          .json({ error: "payment_method_id obrigatório." });
      }

      // Buscar usuário para pegar customer_id
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });
      const customerId = user?.config?.stripe_customer_id;
      if (!customerId) {
        return res
          .status(400)
          .json({ error: "Cliente Stripe não encontrado." });
      }

      // Anexa o método ao customer (se necessário)
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });

      // Seta como novo default para invoices
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: payment_method_id },
      });

      // Opcional/fortemente recomendado: Atualizar todas subscriptions ativas ou em trial para garantir pagamento
      const activeSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
      });
      const validSubs = activeSubs.data.filter(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );
      for (const sub of validSubs) {
        await stripe.subscriptions.update(sub.id, {
          default_payment_method: payment_method_id,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao atualizar método de pagamento:", error);
      res.status(500).json({
        error:
          error.message || "Erro interno ao atualizar método de pagamento.",
      });
    }
  }
}
