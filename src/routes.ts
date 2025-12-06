import { Router } from "express";
import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { TemplateController } from "./controllers/TemplateController";
import { UserConfigController } from "./controllers/UserConfigController";
import { authMiddleware } from "./middlewares/authMiddleware";
import { authorize } from "./middlewares/authorize";
import { UserRole } from "./entities/User";
import { PaymentController } from "./controllers/PaymentController";
import { SubscriptionController } from "./controllers/SubscriptionController";

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
routes.post("/users/by-slug", new UserConfigController().getUserBySlug);

// PROTECTED ROUTES (requer auth)
routes.use(authMiddleware);

routes.get("/profile", new UserController().getProfile);
routes.delete("/profile", new UserController().deleteProfile);

// PROFILE UPDATES
routes.get("/users/me", new UserController().getProfile);
routes.patch("/users/me", new UserController().updateProfile);
routes.delete("/users/me", new UserController().deleteProfile);

// ADMIN ROUTES - List all users (admin only)
routes.get(
  "/users",
  authorize(UserRole.ADMIN),
  new UserController().getAllUsers
);

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
  "/user/config/check-url",
  new UserConfigController().checkUrlAvailability
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
routes.post(
  "/payment/create-setup-intent",
  new PaymentController().createSetupIntent
);
routes.post(
  "/payment/update-payment-method",
  new PaymentController().updatePaymentMethod
);

routes.post(
  "/subscriptions/change",
  new SubscriptionController().changeSubscription
);
routes.post(
  "/subscriptions/cancel",
  new SubscriptionController().cancelSubscription
);
routes.get(
  "/subscriptions/has-used-trial",
  new SubscriptionController().hasUsedTrial
);

export default routes;
