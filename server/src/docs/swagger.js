import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PrimeTrade Assignment API",
      version: "1.0.0",
      description:
        "Scalable REST API with JWT auth, refresh tokens, RBAC, Redis OTP, and task management.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current server origin",
      },
      {
        url: "http://localhost:5000/api/v1",
        description: "Localhost Server",
      },
      {
        url: "http://127.0.0.1:5000/api/v1",
        description: "127.0.0.1 Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Strong@1234" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Strong@1234" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        TaskRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", example: "Complete assignment" },
            description: { type: "string", example: "Finish backend APIs" },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "API health check",
          responses: {
            200: {
              description: "API is healthy",
            },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: { description: "Registered successfully" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: { description: "Login success with access/refresh tokens" },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          summary: "Refresh access token using refresh token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            200: { description: "Tokens refreshed" },
          },
        },
      },
      "/tasks": {
        get: {
          summary: "Get tasks",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Tasks fetched successfully" },
          },
        },
        post: {
          summary: "Create task",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TaskRequest" },
              },
            },
          },
          responses: {
            201: { description: "Task created" },
          },
        },
      },
      "/tasks/{taskId}": {
        get: {
          summary: "Get task by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "taskId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Task fetched" },
          },
        },
        patch: {
          summary: "Update task",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "taskId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Task updated" },
          },
        },
        delete: {
          summary: "Soft delete task",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "taskId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Task moved to recycle bin" },
          },
        },
      },
      "/admin/summary": {
        get: {
          summary: "Admin dashboard summary",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Summary fetched" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
