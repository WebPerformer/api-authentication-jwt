import { Router } from "express";
import { SigninController } from "./controllers/SigninController";
import { SignupController } from "./controllers/SignupController";
import { ForgotPassword } from "./controllers/ForgotPassword";
import { GoogleAuthController } from "./controllers/GoogleAuthController";
import {
  UpdateUsername,
  UpdatePassword,
  UpdateProfileImage,
  DeleteProfile,
} from "./controllers/UpdateUser";
import { CustomersController } from "./controllers/CustomersController";
import { authMiddleware } from "./middlewares/authMiddleware";

const routes = Router();

var cors = require("cors");
routes.use(cors({ origin: "http://localhost:3000", credentials: true }));
routes.use(
  cors({
    origin: "https://unthriving-kasha-subappressed.ngrok-free.dev",
    credentials: true,
  })
);

routes.post("/signup", new SignupController().create);
routes.post("/signin", new SigninController().login);
routes.post("/forgot-password", new ForgotPassword().forgot);
routes.post("/validate-otp", new ForgotPassword().validateOtp);
routes.post("/reset-password", new ForgotPassword().resetPassword);
routes.get("/api/sessions/oauth/google", new GoogleAuthController().googleAuth);

routes.post("/customers", new CustomersController().create);
routes.put("/customers/update", new CustomersController().update);

routes.use(authMiddleware);

routes.get("/profile", new SigninController().getProfile);
routes.delete("/profile", new DeleteProfile().delete);
routes.put("/profile/image", new UpdateProfileImage().update);
routes.put("/profile/username", new UpdateUsername().update);
routes.put("/profile/password", new UpdatePassword().update);

routes.get("/customers", new CustomersController().get);

export default routes;
