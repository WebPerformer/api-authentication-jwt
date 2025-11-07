// controllers/UserConfigController.ts
import { Request, Response } from "express";
import { userRepository } from "../repositories/userRepository";
import { UserConfig } from "../entities/UserConfig";
import { AccessService } from "../services/AccessService";
import { BadRequestError } from "../helpers/api-erros";

export class UserConfigController {
  async getUserConfig(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });

      if (!user) {
        throw new BadRequestError("User not found");
      }

      if (!user?.config) {
        // Criar config se não existir
        const configRepo = userRepository.manager.getRepository(UserConfig);
        const newConfig = configRepo.create({
          user: user,
        });
        await configRepo.save(newConfig);

        user.config = newConfig;
      }

      return res.json({
        success: true,
        data: user!.config,
      });
    } catch (error) {
      console.error("Error fetching user config:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateUserConfig(req: Request, res: Response) {
    try {
      const accessService = new AccessService();

      const userId = req.user.id;
      const { selected_template_id, portfolio_data, is_portfolio_configured } =
        req.body;

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });

      if (!user?.config) {
        throw new BadRequestError("User config not found");
      }

      // Verificar acesso se estiver selecionando template
      if (selected_template_id) {
        const canUseTemplate = await accessService.canUseTemplate(
          userId!,
          selected_template_id
        );

        if (!canUseTemplate) {
          throw new BadRequestError("You don't have access to this template");
        }
      }

      const updateData: any = {};

      if (selected_template_id !== undefined) {
        updateData.selected_template_id = selected_template_id;
      }

      if (portfolio_data !== undefined) {
        updateData.portfolio_data = portfolio_data;
      }

      if (is_portfolio_configured !== undefined) {
        updateData.is_portfolio_configured = is_portfolio_configured;
      }

      await userRepository.manager
        .getRepository("user_configs")
        .update({ id: user.config.id }, updateData);

      // Buscar config atualizada
      const updatedConfig = await userRepository.manager
        .getRepository("user_configs")
        .findOneBy({
          id: user.config.id,
        });

      return res.json({
        success: true,
        data: updatedConfig,
        message: "Config updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating user config:", error);

      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async activateTemplate(req: Request, res: Response) {
    try {
      const accessService = new AccessService();

      const userId = req.user.id;
      const { template_id } = req.body;

      if (!template_id) {
        throw new BadRequestError("Template ID is required");
      }

      // Verificar acesso ao template
      const canUseTemplate = await accessService.canUseTemplate(
        userId!,
        template_id
      );

      if (!canUseTemplate) {
        throw new BadRequestError("You don't have access to this template");
      }

      // Atualizar template selecionado
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config"],
      });

      if (!user?.config) {
        throw new BadRequestError("User config not found");
      }

      await userRepository.manager
        .getRepository("user_configs")
        .update({ id: user.config.id }, { selected_template_id: template_id });

      return res.json({
        success: true,
        message: "Template activated successfully",
      });
    } catch (error: any) {
      console.error("Error activating template:", error);

      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
