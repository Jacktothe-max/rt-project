import express, { type NextFunction, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config.ts";
import { swaggerSpec } from "./swagger.ts";
import teachersRouter from "./routes/teachers.ts";
import schoolsRouter from "./routes/schools.ts";
import teachersV2Router from "./routes/teachers_v2.ts";
import schoolsV2Router from "./routes/schools_v2.ts";
import schoolsV3Router from "./routes/schools_v3.ts";
import v3CountriesRouter from "./routes/v3/countries.ts";
import v3CountryConfigsAdminRouter from "./routes/v3/country_configs_admin.ts";
import v3EnterpriseRouter from "./routes/v3/enterprise.ts";
import v3MessagesRouter from "./routes/v3/messages.ts";
import v3VerificationsRouter from "./routes/v3/verifications.ts";
import v3SubscriptionsRouter from "./routes/v3/subscriptions.ts";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => res.status(200).json({ ok: true }));

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 */

// Swagger UI (docs only; no auth required to view)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { swaggerOptions: { persistAuthorization: true } }));

app.use("/teachers", teachersRouter);
app.use("/schools", schoolsRouter);
// Phase 2 additive endpoints (Phase 1 endpoints remain unchanged)
app.use("/teachers/v2", teachersV2Router);
app.use("/schools/v2", schoolsV2Router);
// Phase 3 school discovery endpoints (country-aware). Phase 1 + 2 remain unchanged.
app.use("/schools/v3", schoolsV3Router);
// Phase 3 additive endpoints (Phase 1 + 2 remain unchanged)
app.use("/v3", v3CountriesRouter);
app.use("/v3", v3CountryConfigsAdminRouter);
app.use("/v3", v3EnterpriseRouter);
app.use("/v3", v3MessagesRouter);
app.use("/v3", v3VerificationsRouter);
app.use("/v3", v3SubscriptionsRouter);

// Minimal error handler (keeps responses consistent)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
