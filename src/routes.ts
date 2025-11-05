import { Router } from "express";
import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { ProductsController } from "./controllers/ProductsController";
import { authMiddleware } from "./middlewares/authMiddleware";
import { authorize } from "./middlewares/authorize";
import { UserRole } from "./entities/User";

const routes = Router();

var cors = require("cors");
routes.use(cors({ origin: "http://localhost:3000", credentials: true }));

// 👇 AUTH ROUTES - Agrupadas
routes.post("/auth/signin", new AuthController().signIn);
routes.post("/auth/signup", new AuthController().signUp);
routes.get("/api/sessions/oauth/google", new AuthController().googleAuth);
routes.post("/auth/forgot-password", new AuthController().forgotPassword);
routes.post("/auth/validate-otp", new AuthController().validateOtp);
routes.post("/auth/reset-password", new AuthController().resetPassword);

// 👇 PUBLIC ROUTES
routes.get("/products", new ProductsController().getProducts);

// 👇 PROTECTED ROUTES (requer auth)
routes.use(authMiddleware);

routes.get("/profile", new UserController().getProfile);
routes.delete("/profile", new UserController().deleteProfile);

// 👇 PROFILE UPDATES - Mais RESTful
routes.get("/users/me", new UserController().getProfile);
routes.patch("/users/me", new UserController().updateProfile);
routes.delete("/users/me", new UserController().deleteProfile);

export default routes;
