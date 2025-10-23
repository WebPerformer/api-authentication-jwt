import { Router } from "express";
import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { CustomersController } from "./controllers/CustomersController";
import { authMiddleware } from "./middlewares/authMiddleware";
import { authorize } from "./middlewares/authorize";
import { UserRole } from "./entities/User";

const routes = Router();

var cors = require("cors");
routes.use(cors({ origin: "http://localhost:3000", credentials: true }));

routes.post("/signin", new AuthController().signIn);
routes.post("/forgot-password", new AuthController().forgotPassword);
routes.post("/validate-otp", new AuthController().validateOtp);
routes.post("/reset-password", new AuthController().resetPassword);

routes.post("/customers", new CustomersController().createCustomer);
routes.put("/customers/update", new CustomersController().updateCustomer);

routes.use(authMiddleware);

routes.get("/profile", new UserController().getProfile);
routes.delete("/profile", new UserController().deleteProfile);
routes.put("/profile/image", new UserController().updateProfileImage);
routes.put("/profile/username", new UserController().changeUsernameProfile);
routes.put("/profile/password", new UserController().changePasswordProfile);

routes.get(
  "/customers",
  authorize(UserRole.ADMIN),
  new CustomersController().getCustomers
);
routes.get("/customers/profile", new CustomersController().getCustomersProfile);
routes.put(
  "/subscriptions/cancel",
  new CustomersController().cancelSubscription
);

export default routes;
