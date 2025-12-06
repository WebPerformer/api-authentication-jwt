import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import {
  userRepository,
  userOtpRepository,
} from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  getGoogleOAuthTokens,
  getGoogleUser,
  createUser,
} from "../services/user.Service";

export class AuthController {
  async signIn(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestError("E-mail ou senha inválidos");
    }

    const verifyPass = await bcrypt.compare(password, user.password);

    if (!verifyPass) {
      throw new BadRequestError("E-mail ou senha inválidos");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_PASS ?? "",
      { expiresIn: "7d" }
    );

    const { password: _, ...userLogin } = user;

    return res.json({
      user: userLogin,
      token: token,
    });
  }

  async signUp(req: Request, res: Response) {
    const { username, email, password } = req.body;

    const userExists = await userRepository.findOneBy({ email });

    if (userExists) {
      throw new BadRequestError(
        "Por favor, verifique as informações fornecidas."
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = userRepository.create({
      username,
      email,
      password: hashPassword,
    });

    await userRepository.save(newUser);

    const { password: _, ...user } = newUser;

    return res.status(201).json(user);
  }

  async googleAuth(req: Request, res: Response) {
    const code = req.query.code;

    try {
      const { id_token, access_token } = await getGoogleOAuthTokens(
        code as string
      );

      const googleUser = await getGoogleUser(id_token, access_token);

      const user = await createUser(googleUser);

      const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? "", {
        expiresIn: "7d",
      });

      return res.redirect(
        `http://localhost:3000/api/google/callback?token=${token}`
      );
    } catch (error) {
      console.error("Erro ao processar autenticação do Google:", error);
      throw new BadRequestError("Erro ao processar autenticação do Google");
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError(
        "Não foi possível enviar o código, tente novamente mais tarde."
      );
    }

    const now = new Date();
    const userOtp = await userOtpRepository.findOne({
      where: {
        user: { id: user.id },
      },
    });
    if (userOtp) {
      const timeSinceLast =
        now.getTime() - new Date(userOtp.lastAttemptAt || 0).getTime();
      const withinCooldown = timeSinceLast < 60 * 60 * 1000; // 1 hora

      if (userOtp.attempts >= 3 && withinCooldown) {
        throw new BadRequestError(
          "Você excedeu o número máximo de tentativas. Tente novamente mais tarde."
        );
      }

      if (!withinCooldown) {
        userOtp.attempts = 0;
      }

      await userOtpRepository.delete(userOtp.id);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await userOtpRepository.save({
      otpCode: otp,
      otpExpireAt: otpExpireAt,
      user: user,
      attempts: (userOtp?.attempts || 0) + 1,
      lastAttemptAt: now,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Gabriel Silva Araujo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Redefinir senha",
      text: `Seu código OTP para redefinir sua senha: ${otp}. Expira em 5 minutos.`,
      html: `<b>Seu código OTP para redefinir sua senha: ${otp}. Expira em 5 minutos.</b>`,
    });

    return res.json({ message: "Código OTP enviado por e-mail" });
  }

  async validateOtp(req: Request, res: Response) {
    const { email, otp } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("Usuário não encontrado");
    }

    const userOtp = await userOtpRepository.findOne({
      where: {
        otpCode: otp,
        user: { id: user.id },
      },
    });
    if (!userOtp || userOtp.otpExpireAt! < new Date()) {
      if (userOtp) {
        await userOtpRepository.delete(userOtp.id);
      }
      throw new BadRequestError("Código OTP inválido ou expirado");
    }

    await userOtpRepository.update(userOtp.id, {
      otpValidated: true,
    });

    return res.json({
      message: "Código OTP validado. Agora, redefina sua senha.",
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("Usuário não encontrado");
    }

    const userOtp = await userOtpRepository.findOne({
      where: {
        otpCode: otp,
        user: { id: user.id },
      },
    });

    if (!userOtp || !userOtp.otpValidated) {
      throw new BadRequestError("Código OTP inválido ou expirado");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(user.id, {
      password: hashedPassword,
    });

    await userOtpRepository.delete(userOtp.id);

    return res.json({ message: "Redefinição de senha com sucesso" });
  }

  async getProfile(req: Request, res: Response) {
    return res.json(req.user);
  }
}
