import { Router } from "express";
import { SigninController } from "./controllers/SigninController";
import { SignupController } from "./controllers/SignupController";
import { ForgotPassword } from "./controllers/ForgotPassword";
import { authMiddleware } from "./middlewares/authMiddleware";

const routes = Router();

var cors = require("cors");
routes.use(cors({ origin: "http://localhost:3000", credentials: true }));

routes.post("/signup", new SignupController().create);
routes.post("/signin", new SigninController().login);
routes.post("/forgot-password", new ForgotPassword().forgot);
routes.post("/validate-otp", new ForgotPassword().validateOtp);
routes.post("/reset-password", new ForgotPassword().resetPassword);

routes.use(authMiddleware);

routes.get("/profile", new SigninController().getProfile);

export default routes;
