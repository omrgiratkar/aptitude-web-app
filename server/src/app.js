import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import practiceRoutes from "./routes/practice.js";
import testRoutes from "./routes/tests.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "aptitude-test-api" }));
app.use("/api/practice", practiceRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
  if (err?.name === "ValidationError") return res.status(400).json({ message: err.message });
  res.status(500).json({ message: "An unexpected server error occurred." });
});

export default app;
