import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createScorecardBuffer } from "../utils/scorecard.js";
import { createTransporter } from "../utils/email.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [students, questions, attempts, pending] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Question.countDocuments({ active: true }),
      TestAttempt.countDocuments({ status: { $in: ["submitted", "timed_out"] } }),
      TestAttempt.countDocuments({ status: { $in: ["submitted", "timed_out"] }, releasedAt: null })
    ]);
    res.json({ students, questions, attempts, pendingScorecards: pending });
  } catch (e) { next(e); }
});

router.get("/students", async (req, res, next) => {
  try {
    const filter = { role: "student" };
    const q = String(req.query.q || "").trim();
    if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }, { department: new RegExp(escapeRegex(q), "i") }];
    const students = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(200).lean();
    const ids = students.map(s => s._id);
    const attempts = await TestAttempt.find({ studentId: { $in: ids }, status: { $in: ["submitted", "timed_out"] } }).select("studentId score total status releasedAt scorecardEmailStatus submittedAt").sort({ submittedAt: -1 }).lean();
    res.json({ students: students.map(s => ({ ...s, realTestAttempts: attempts.filter(a => String(a.studentId) === String(s._id)) })) });
  } catch (e) { next(e); }
});
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

router.get("/questions", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json({ questions });
  } catch (e) { next(e); }
});

router.post("/questions", async (req, res, next) => {
  try {
    const { category, difficulty, questionText, options, correctOption, explanation, active = true } = req.body;
    if (!["Quantitative Aptitude", "Reasoning", "Verbal/English"].includes(category) ||
        !["Easy", "Medium", "Hard"].includes(difficulty) ||
        !questionText?.trim() || !Array.isArray(options) || options.length < 2 ||
        !Number.isInteger(correctOption) || correctOption < 0 || correctOption >= options.length ||
        !explanation?.trim()) return res.status(400).json({ message: "Please provide a valid category, difficulty, question, options, correct option, and explanation." });
    const question = await Question.create({ category, difficulty, questionText: questionText.trim(), options: options.map(o => String(o).trim()), correctOption, explanation: explanation.trim(), active });
    res.status(201).json({ question });
  } catch (e) { next(e); }
});

router.put("/questions/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
    const { category, difficulty, questionText, options, correctOption, explanation, active } = req.body;
    const update = {};
    if (category !== undefined) update.category = category;
    if (difficulty !== undefined) update.difficulty = difficulty;
    if (questionText !== undefined) update.questionText = String(questionText).trim();
    if (options !== undefined) update.options = options.map(o => String(o).trim());
    if (correctOption !== undefined) update.correctOption = Number(correctOption);
    if (explanation !== undefined) update.explanation = String(explanation).trim();
    if (active !== undefined) update.active = Boolean(active);
    const question = await Question.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ message: "Question not found." });
    res.json({ question });
  } catch (e) { next(e); }
});

router.delete("/questions/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found." });
    res.json({ deleted: true });
  } catch (e) { next(e); }
});

router.get("/attempts", async (req, res, next) => {
  try {
    const attempts = await TestAttempt.find({ status: { $in: ["submitted", "timed_out"] } })
      .populate("studentId", "name email department gender")
      .sort({ submittedAt: -1 }).limit(300).lean();
    res.json({ attempts });
  } catch (e) { next(e); }
});

async function getAttempt(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return TestAttempt.findOne({ _id: id, status: { $in: ["submitted", "timed_out"] } }).populate("studentId", "name email department gender");
}

router.get("/attempts/:id/scorecard", async (req, res, next) => {
  try {
    const attempt = await getAttempt(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Completed test attempt not found." });
    const buffer = await createScorecardBuffer({ student: attempt.studentId, attempt });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="scorecard-${attempt._id}.pdf"`);
    res.send(buffer);
  } catch (e) { next(e); }
});

router.post("/attempts/:id/send-scorecard", async (req, res, next) => {
  let attempt;
  try {
    attempt = await getAttempt(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Completed test attempt not found." });
    const transporter = createTransporter();
    const student = attempt.studentId;
    const buffer = await createScorecardBuffer({ student, attempt });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: student.email,
      subject: "Your Aptitude Test Scorecard",
      text: `Hello ${student.name},\n\nPlease find attached your aptitude test scorecard.\n\nRegards,\nAptitude Test Admin`,
      attachments: [{ filename: `scorecard-${attempt._id}.pdf`, content: buffer, contentType: "application/pdf" }]
    });
    attempt.releasedAt = new Date();
    attempt.scorecardEmailSentAt = new Date();
    attempt.scorecardEmailStatus = "sent";
    await attempt.save();
    res.json({ sent: true, released: true, message: `Scorecard email accepted by the configured mail server for ${student.email}.` });
  } catch (e) {
    if (attempt) {
      attempt.scorecardEmailStatus = "failed";
      await attempt.save().catch(() => {});
    }
    if (e.message?.includes("Email is not configured")) return res.status(503).json({ message: e.message });
    next(e);
  }
});

export default router;
