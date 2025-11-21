import { Router } from "express";
import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { TemplateController } from "./controllers/TemplateController";
import { UserConfigController } from "./controllers/UserConfigController";
import { WebhookController } from "./controllers/WebhookController";
import { authMiddleware } from "./middlewares/authMiddleware";
import { authorize } from "./middlewares/authorize";
import { UserRole } from "./entities/User";
import { PaymentController } from "./controllers/PaymentController";

const routes = Router();

var cors = require("cors");
routes.use(cors({ origin: "http://localhost:3000", credentials: true }));

// AUTH ROUTES - Agrupadas
routes.post("/auth/signin", new AuthController().signIn);
routes.post("/auth/signup", new AuthController().signUp);
routes.get("/api/sessions/oauth/google", new AuthController().googleAuth);
routes.post("/auth/forgot-password", new AuthController().forgotPassword);
routes.post("/auth/validate-otp", new AuthController().validateOtp);
routes.post("/auth/reset-password", new AuthController().resetPassword);

// PUBLIC ROUTES
routes.post("/webhooks/stripe", new WebhookController().handleWebhook);

routes.post("/users/by-slug", new UserConfigController().getUserBySlug);

// PROTECTED ROUTES (requer auth)
routes.use(authMiddleware);

routes.get("/profile", new UserController().getProfile);
routes.delete("/profile", new UserController().deleteProfile);

// PROFILE UPDATES
routes.get("/users/me", new UserController().getProfile);
routes.patch("/users/me", new UserController().updateProfile);
routes.delete("/users/me", new UserController().deleteProfile);

// TEMPLATES ROUTES
routes.get("/templates", new TemplateController().getTemplates);
routes.get("/templates/:id", new TemplateController().getTemplateById);

// USER CONFIG ROUTES
routes.get("/user/config", new UserConfigController().getUserConfig);
routes.patch("/user/config", new UserConfigController().updateUserConfig);
routes.post(
  "/user/config/activate-template",
  new UserConfigController().activateTemplate
);

routes.post(
  "/payment/create-intent",
  new PaymentController().createPaymentIntent
);
routes.post(
  "/payment/create-subscription",
  new PaymentController().createSubscription
);
routes.post(
  "/payment/confirm-payment",
  new PaymentController().confirmOneTimePayment
);

export default routes;
