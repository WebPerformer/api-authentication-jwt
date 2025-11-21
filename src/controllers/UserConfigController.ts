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
        relations: ["config", "config.categories"],
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

      // Formatar resposta para manter compatibilidade com frontend
      const responseData = {
        ...user.config,
        template_data: {
          url: user.config.template_url || "",
          description: user.config.description || "",
          instagram: user.config.instagram || "",
          twitter: user.config.twitter || "",
          whatsapp: user.config.whatsapp || "",
          categories: user.config.categories || [],
        },
      };

      return res.json({
        success: true,
        data: responseData,
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
      const { selected_template_id, template_data, is_template_configured } =
        req.body;

      console.log("=== UPDATE USER CONFIG ===");
      console.log("User ID:", userId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["config", "config.categories"],
      });

      console.log("User found:", !!user);
      console.log("User config:", user?.config);

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

      // Atualizar campos básicos do UserConfig
      if (template_data?.url !== undefined) {
        updateData.template_url = template_data.url;
      }
      if (template_data?.description !== undefined) {
        updateData.description = template_data.description;
      }
      if (template_data?.instagram !== undefined) {
        updateData.instagram = template_data.instagram;
      }
      if (template_data?.twitter !== undefined) {
        updateData.twitter = template_data.twitter;
      }
      if (template_data?.whatsapp !== undefined) {
        updateData.whatsapp = template_data.whatsapp;
      }

      if (is_template_configured !== undefined) {
        updateData.is_template_configured = is_template_configured;
      }

      console.log("Update data to save:", JSON.stringify(updateData, null, 2));

      // Atualizar UserConfig
      if (Object.keys(updateData).length > 0) {
        await userRepository.manager
          .getRepository("user_configs")
          .update({ id: user.config.id }, updateData);
      }

      // PROCESSAR CATEGORIAS DIRETAMENTE NO MÉTODO
      if (template_data?.categories) {
        const categoryRepo = userRepository.manager.getRepository(
          "template_categories"
        );

        // Buscar categorias existentes
        const existingCategories = await categoryRepo.find({
          where: { userConfigId: user.config.id },
        });

        console.log("Existing categories:", existingCategories.length);
        console.log("New categories:", template_data.categories.length);

        // Para cada categoria recebida
        for (const categoryData of template_data.categories) {
          if (categoryData.id && categoryData.id.startsWith("category-")) {
            // Nova categoria - criar
            const newCategory = categoryRepo.create({
              name: categoryData.name,
              images: categoryData.images,
              userConfigId: user.config.id,
            });
            await categoryRepo.save(newCategory);
            console.log("Created new category:", newCategory.id);
          } else {
            // Categoria existente - atualizar
            const existingCategory = existingCategories.find(
              (cat) => cat.id === categoryData.id
            );
            if (existingCategory) {
              await categoryRepo.update(existingCategory.id, {
                name: categoryData.name,
                images: categoryData.images,
              });
              console.log("Updated category:", existingCategory.id);
            }
          }
        }

        // Deletar categorias que não estão mais na lista
        const receivedCategoryIds = template_data.categories
          .map((cat: any) => cat.id)
          .filter((id: string) => !id.startsWith("category-"));
        const categoriesToDelete = existingCategories.filter(
          (cat) => !receivedCategoryIds.includes(cat.id)
        );

        for (const categoryToDelete of categoriesToDelete) {
          await categoryRepo.delete(categoryToDelete.id);
          console.log("Deleted category:", categoryToDelete.id);
        }
      }

      // Buscar config atualizada com categorias
      const updatedConfig = await userRepository.manager
        .getRepository("user_configs")
        .findOne({
          where: { id: user.config.id },
          relations: ["categories"],
        });

      console.log("Updated config:", updatedConfig);

      return res.json({
        success: true,
        data: updatedConfig,
        message: "Config updated successfully",
      });
    } catch (error: any) {
      console.error("=== ERROR IN updateUserConfig ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      const errorMessage = error.message || "Internal server error";
      return res.status(500).json({
        success: false,
        error: errorMessage,
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

  async getUserBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.body;

      console.log("=== GET USER BY SLUG ===");
      console.log("Slug received:", slug);

      // Buscar pelo template_url
      const userConfig = await userRepository.manager
        .getRepository("user_configs")
        .findOne({
          where: { template_url: slug },
          relations: ["user", "categories"],
        });

      if (!userConfig) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Resposta simplificada - sem buscar template
      const response = {
        id: userConfig.user.id,
        username: userConfig.user.username,
        email: userConfig.user.email,
        profileImage: userConfig.user.profileImage,
        role: userConfig.user.role,
        config: {
          id: userConfig.id,
          selected_template_id: userConfig.selected_template_id,
          template_url: userConfig.template_url,
          description: userConfig.description,
          instagram: userConfig.instagram,
          twitter: userConfig.twitter,
          whatsapp: userConfig.whatsapp,
          is_template_configured: userConfig.is_template_configured,
          categories: userConfig.categories || [],
        },
      };

      return res.json({
        success: true,
        data: {
          user: response,
          // templateInfo pode ser omitido ou ser um objeto simples
        },
      });
    } catch (error) {
      console.error("Error fetching user by slug:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
