import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";

export class UserController {
  async getProfile(req: Request, res: Response) {
    return res.json(req.user);
  }

  async updateProfile(req: Request, res: Response) {
    const { username, profileImage, newPassword } = req.body;
    const userId = req.user.id;

    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    const updateData: any = {};

    // Atualiza apenas os campos que foram enviados
    if (username !== undefined) {
      updateData.username = username;
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    if (newPassword !== undefined) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Se não enviou nenhum campo para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("No fields to update");
    }

    await userRepository.update(userId!, updateData);

    // Buscar usuário atualizado para retornar
    const updatedUser = await userRepository.findOneBy({ id: userId });
    const { password: _, ...userWithoutPassword } = updatedUser!;

    return res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  }

  async deleteProfile(req: Request, res: Response) {
    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    await userRepository.delete(user.id);

    return res.json({ message: "Profile deleted successfully" });
  }

  async getAllUsers(req: Request, res: Response) {
    const users = await userRepository.find({
      relations: ["config"],
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        role: true,
        config: {
          id: true,
          selected_template_id: true,
          template_url: true,
          is_template_configured: true,
          stripe_customer_id: true,
        },
      },
    });

    // Remove password from response
    const usersWithoutPassword = users.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return res.json({
      success: true,
      data: usersWithoutPassword,
    });
  }
}
