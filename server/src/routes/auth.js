import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const allowedGenders = ["Female", "Male", "Non-binary", "Prefer not to say"];

function makeToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, gender: user.gender, department: user.department };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, gender, department } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !gender || !department?.trim()) {
      return res.status(400).json({ message: "Name, email, password, gender, and department are required." });
    }
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (!allowedGenders.includes(gender)) return res.status(400).json({ message: "Select a valid gender option." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, gender, department: department.trim(), role: "student" });
    return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post("/admin-register", async (req, res, next) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !inviteCode) return res.status(400).json({ message: "Name, email, password, and invite code are required." });
    if (!process.env.ADMIN_INVITE_CODE || inviteCode !== process.env.ADMIN_INVITE_CODE) return res.status(403).json({ message: "Invalid Admin invitation code." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role: "admin" });
    return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password." });
    return res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
