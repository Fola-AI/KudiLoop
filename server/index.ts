import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { registerRoutes } from "./routes";

const app = express();

// CORS configuration for React Native mobile apps
app.use(cors({
  origin: [
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:8081',  // Expo dev server
    'exp://localhost:8081',   // Expo Go
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version', 'X-Platform']
}));

// Serve uploaded files statically (partner logos, receipts, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Clerk middleware - validates JWT tokens and adds auth to request
app.use(clerkMiddleware());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[API] ${logLine}`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string; stack?: string };
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    
    console.error('[Error Handler]', message);
    if (error.stack) {
      console.error('[Error Stack]', error.stack);
    }

    res.status(status).json({ message });
  });

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`🚀 KudiLoop API server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();
