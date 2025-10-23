import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import {
  userRepository,
  userOtpRepository,
} from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export class AuthController {
  async signIn(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestError("E-mail or password is invalid");
    }

    const verifyPass = await bcrypt.compare(password, user.password);

    if (!verifyPass) {
      throw new BadRequestError("E-mail or password is invalid");
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

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("We cannot send the code, try again later");
    }

    const now = new Date();
    const userOtp = await userOtpRepository.findOneBy({
      user: user,
    });
    if (userOtp) {
      const timeSinceLast =
        now.getTime() - new Date(userOtp.lastAttemptAt || 0).getTime();
      const withinCooldown = timeSinceLast < 60 * 60 * 1000; // 1 hora

      if (userOtp.attempts >= 3 && withinCooldown) {
        throw new BadRequestError(
          "You have exceeded the maximum number of attempts. Try again later."
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
      subject: "Reset Password",
      text: `Your OTP code to reset your password: ${otp}. It expires in 5 minutes.`,
      html: `<b>Your OTP code to reset your password: ${otp}. It expires in 5 minutes.</b>`,
    });

    return res.json({ message: "OTP code sent to email" });
  }

  async validateOtp(req: Request, res: Response) {
    const { email, otp } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("User not found");
    }

    const userOtp = await userOtpRepository.findOneBy({
      otpCode: otp,
      user: user,
    });
    if (!userOtp || userOtp.otpExpireAt! < new Date()) {
      await userOtpRepository.delete(userOtp!.id);
      throw new BadRequestError("Invalid or expired OTP code");
    }

    await userOtpRepository.update(userOtp.id, {
      otpValidated: true,
    });

    return res.json({
      message: "OTP code validated. Now, reset your password.",
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestError("User not found");
    }

    const userOtp = await userOtpRepository.findOneBy({
      otpCode: otp,
      user: user,
    });

    if (!userOtp || !userOtp.otpValidated) {
      throw new BadRequestError("Invalid or expired OTP code");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(user.id, {
      password: hashedPassword,
    });

    await userOtpRepository.delete(userOtp.id);

    return res.json({ message: "Password reset successfully" });
  }

  async getProfile(req: Request, res: Response) {
    return res.json(req.user);
  }
}
