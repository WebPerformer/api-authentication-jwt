import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { customerRepository } from "../repositories/customerRepository";

export class CustomersController {
  async get(req: Request, res: Response) {
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
        data: customers,
        count: customers.length,
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

  async create(req: Request, res: Response) {
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

    const newCustomer = customerRepository.create({
      customer_id,
      name,
      email,
      phone,
      slug,
      subscription_id,
      status,
      created_at: new Date(),
    });

    await customerRepository.save(newCustomer);

    return res.status(201).json(newCustomer);
  }

  async update(req: Request, res: Response) {
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
}
