import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Relief Teaching Marketplace API",
      version: "0.1.0",
      description: "Phase 1–3 APIs (Express + Prisma)."
    },
    servers: [{ url: "http://localhost:3001" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: { error: { type: "string" } },
          required: ["error"]
        }
      }
    },
    tags: [
      { name: "Health" },
      { name: "Teachers (Phase 1)" },
      { name: "Schools (Phase 1)" },
      { name: "Teachers (Phase 2)" },
      { name: "Schools (Phase 2)" },
      { name: "Schools (Phase 3)" },
      { name: "V3 Countries" },
      { name: "Admin" },
      { name: "Enterprise" },
      { name: "Messaging" },
      { name: "Credential Verification" },
      { name: "Subscriptions" }
    ]
  },
  apis: ["./src/server.ts", "./src/routes/**/*.ts"]
});


