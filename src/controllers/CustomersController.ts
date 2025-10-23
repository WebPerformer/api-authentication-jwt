import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { UserRole } from "../entities/User";
import { customerRepository } from "../repositories/customerRepository";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";
import Stripe from "stripe";

export class CustomersController {
  async getCustomers(req: Request, res: Response) {
    try {
      const customers = await customerRepository.find({
        order: {
          created_at: "DESC",
        },
        select: [
          "customer_id",
          "name",
          "email",
          "phone",
          "slug",
          "subscription_id",
          "status",
          "created_at",
          "updated_at",
        ],
      });

      return res.json({
        success: true,
        data: Array.isArray(customers) ? customers : [],
        count: Array.isArray(customers) ? customers.length : 0,
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to fetch customers",
      });
    }
  }

  async getCustomersProfile(req: Request, res: Response) {
    try {
      const slug = req.query.slug as string;
      const userId = req.user.id;
      const userRole = req.user.role;

      let customer;

      if (slug && userRole === UserRole.ADMIN) {
        // Apenas admin pode buscar por slug de outros usuários
        customer = await customerRepository.findOne({
          where: { slug },
          relations: ["user"],
        });
      } else if (slug) {
        // Usuário não-admin tentando acessar por slug - só permite se for o próprio
        customer = await customerRepository.findOne({
          where: {
            slug,
            user: { id: userId }, // Garante que é o próprio usuário
          },
          relations: ["user"],
        });
      } else {
        // Busca o próprio customer
        customer = await customerRepository.findOne({
          where: { user: { id: userId } },
          relations: ["user"],
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async createCustomer(req: Request, res: Response) {
    const { customer_id, name, email, phone, slug, subscription_id, status } =
      req.body;

    const webhookToken = req.headers["x-webhook-token"];
    const isWebhook = webhookToken === process.env.WEBHOOK_SECRET;

    if (!isWebhook) {
      throw new BadRequestError("Please check the information provided.");
    }

    const subExists = await customerRepository.findOneBy({ subscription_id });
    if (subExists) {
      throw new BadRequestError("Please check the information provided.");
    }

    let user = await userRepository.findOneBy({ email });

    if (!user) {
      const hashPassword = await bcrypt.hash(customer_id, 10);

      user = userRepository.create({
        username: name,
        email,
        password: hashPassword,
      });

      await userRepository.save(user);
    }

    const newCustomer = customerRepository.create({
      customer_id,
      name,
      email,
      phone,
      slug,
      subscription_id,
      status,
      user,
    });

    await customerRepository.save(newCustomer);

    return res.status(201).json(newCustomer);
  }

  async updateCustomer(req: Request, res: Response) {
    const { customer_id, subscription_id, status } = req.body;

    const webhookToken = req.headers["x-webhook-token"];
    const isWebhook = webhookToken === process.env.WEBHOOK_SECRET;

    if (!isWebhook) {
      throw new BadRequestError("Please check the information provided.");
    }

    await customerRepository.update(
      { customer_id },
      {
        status,
        subscription_id,
        updated_at: new Date(),
      }
    );

    return res.json({ message: "Customer updated successfully" });
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscription_id } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!subscription_id) {
        return res.status(400).json({
          success: false,
          error: "Subscription ID is required",
        });
      }

      // Buscar o customer pela subscription_id com validação de segurança
      let customer;

      if (userRole === UserRole.ADMIN) {
        customer = await customerRepository.findOne({
          where: { subscription_id },
          relations: ["user"],
        });
      } else {
        customer = await customerRepository.findOne({
          where: {
            subscription_id,
            user: { id: userId },
          },
          relations: ["user"],
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      if (!customer.status) {
        return res.status(400).json({
          success: false,
          error: "Subscription is already canceled",
        });
      }

      // Configurar Stripe corretamente
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-09-30.clover",
      });

      // Cancelar no Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(
        subscription_id
      );

      // Atualizar status no banco de dados
      customer.status = false;
      customer.updated_at = new Date();
      await customerRepository.save(customer);

      return res.json({
        success: true,
        data: {
          message: "Subscription canceled successfully",
          customer: {
            customer_id: customer.customer_id,
            name: customer.name,
            status: customer.status,
            subscription_id: customer.subscription_id,
          },
        },
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);

      // Tratar erros específicos do Stripe
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
