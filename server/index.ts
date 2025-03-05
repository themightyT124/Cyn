import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import net from "net";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = createServer(app); // ✅ Ensure server is properly created

// ✅ Debugging Middleware (Check if requests reach here)
app.use((req, res, next) => {
  console.log(`🟢 Received request: ${req.method} ${req.url}`);
  next();
});

// ✅ Simple Debugging Route (Test if Express is working)
app.get("/test", (req, res) => {
  console.log("🟢 /test route hit!");
  res.json({ message: "Server is working!" });
});

const checkPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") resolve(true);
      else resolve(false);
    });
    tester.once("listening", () => {
      tester.close();
      resolve(false);
    });
    tester.listen(port);
  });
};

(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`🔴 Error: ${message}`);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const startServer = async (port: number) => {
    const inUse = await checkPortInUse(port);
    if (inUse) {
      console.error(`⚠️ Port ${port} is already in use!`);
      process.exit(1);
    }

    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${port}`);
      log(`✅ Server running on port ${port}`); // ✅ Ensure log is triggered
    });
  };

  startServer(3000);
})();
