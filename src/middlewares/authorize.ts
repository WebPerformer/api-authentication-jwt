import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../helpers/api-erros";
import { UserRole } from "../entities/User";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role!)) {
      throw new UnauthorizedError("Acesso negado");
    }

    next();
  };
