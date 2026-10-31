import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import routes from "./routes";
import { notFoundHandler } from "./middleware/not-found";
import { errorHandler } from "./middleware/error-handler";
import { generalRateLimiter } from "./middleware/rate-limiter";

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS Configuration
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Brightloop-Request"],
    }),
  );

  // 3. Structured Request Logging (Pino)
  if (env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === "/api/v1/health",
        },
      }),
    );
  }

  // 4. Rate Limiting
  app.use(generalRateLimiter);

  // 5. Cookie Parser
  app.use(cookieParser());

  // 6. JSON Body Parser with reasonable payload size limit
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // 7. API Routes
  app.use("/api/v1", routes);

  // 8. 404 Not Found Handler
  app.use(notFoundHandler);

  // 9. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
