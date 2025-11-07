import "express-async-errors";
import express from "express";
import { AppDataSource } from "./data-source";
import { errorMiddleware } from "./middlewares/error";
import routes from "./routes";

AppDataSource.initialize().then(() => {
  const app = express();

  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        if (req.originalUrl.startsWith("/webhooks/stripe")) {
          req.rawBody = buf.toString();
        }
      },
    })
  );

  app.post("/webhooks/stripe", (req, res) => {
    req.body = req.rawBody;
  });

  app.use(routes);

  app.use(errorMiddleware);
  return app.listen(process.env.PORT);
});
