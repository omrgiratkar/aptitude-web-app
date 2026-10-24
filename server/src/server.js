import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = Number(process.env.PORT || 5000);
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) throw new Error("JWT_SECRET must be configured with at least 24 characters.");
  await connectDB();
  app.listen(port, () => console.log(`Aptitude Test API running on http://localhost:${port}`));
} catch (error) {
  console.error("Failed to start server:", error.message);
  process.exit(1);
}
