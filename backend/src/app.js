import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import env from "./config/env.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { ApiError } from "./utils/ApiError.js";
import { GlobalErrorHandler } from "./middlewares/ErrorMiddleware.js";
import { RateLimiter } from "./config/rateLimit.js";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limiter - sab APIs pe lagu
app.use('/api', RateLimiter);

// Load YAML
const swaggerDocument = YAML.load("./src/swagger/api-docs.yaml");

// Serve static files
app.use("/uploads", express.static("uploads"));

// Swagger UI route
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use("/api", routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Global error handler
app.use(GlobalErrorHandler);

export default app;
