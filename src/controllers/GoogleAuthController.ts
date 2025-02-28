import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { getGoogleOAuthTokens, getGoogleUser, createUser } from "../services/user.Service";
import jwt from "jsonwebtoken";

export class GoogleAuthController {
  async googleAuth(req: Request, res: Response) {
    const code = req.query.code;

    try {
      const { id_token, access_token } = await getGoogleOAuthTokens(code as string);
      
      const googleUser = await getGoogleUser(id_token, access_token);
      
      const user = await createUser(googleUser);

      const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? "", {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;

      return res.redirect(`http://localhost:3000/callback/google?token=${token}`);
    } catch (error) {
      console.error("Erro ao processar autenticação do Google:", error);
      throw new BadRequestError("Erro ao processar autenticação do Google");
    }
  }
}
