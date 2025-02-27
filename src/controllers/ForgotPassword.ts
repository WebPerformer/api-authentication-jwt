import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";
const nodemailer = require("nodemailer");

export class ForgotPassword {
  async forgot(req: Request, res: Response) {
    const { email } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("E-mail não encontrado");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await userRepository.update(user.id, {
      otpCode: otp,
      otpExpireAt: otpExpireAt,
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
      subject: "Redefinição de Senha",
      text: `Seu código OTP para redefinição de senha: ${otp}. Ele expira em 5 minutos.`,
      html: `<b>Seu código OTP para redefinição de senha: ${otp}. Ele expira em 5 minutos.</b>`,
    });

    return res.json({ message: "Código OTP enviado para o e-mail" });
  }

  async validateOtp(req: Request, res: Response) {
    const { email, otp } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (
      !user ||
      user.otpCode !== otp ||
      !user.otpExpireAt ||
      new Date() > user.otpExpireAt
    ) {
      throw new BadRequestError("Código OTP inválido ou expirado");
    }

    return res.json({
      message: "Código OTP validado. Agora, redefina sua senha.",
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (
      !user ||
      user.otpCode !== otp ||
      !user.otpExpireAt ||
      new Date() > user.otpExpireAt
    ) {
      throw new BadRequestError("Código OTP inválido ou expirado");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(user.id, {
      password: hashedPassword,
      otpCode: null,
      otpExpireAt: null,
    });

    return res.json({ message: "Senha redefinida com sucesso" });
  }
}
