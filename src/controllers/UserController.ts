import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";

export class UserController {
  async getProfile(req: Request, res: Response) {
    return res.json(req.user);
  }

  async changeUsernameProfile(req: Request, res: Response) {
    const { username } = req.body;

    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    await userRepository.update(user.id, { username });

    return res.json({ message: "Username updated successfully" });
  }

  async updateProfileImage(req: Request, res: Response) {
    const { profileImage } = req.body;

    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    await userRepository.update(user.id, { profileImage });

    return res.json({ message: "Avatar updated successfully" });
  }

  async changePasswordProfile(req: Request, res: Response) {
    const { newPassword } = req.body;

    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(user.id, { password: hashedNewPassword });

    return res.json({ message: "Password updated successfully" });
  }

  async deleteProfile(req: Request, res: Response) {
    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    await userRepository.delete(user.id);

    return res.json({ message: "Profile deleted successfully" });
  }
}
