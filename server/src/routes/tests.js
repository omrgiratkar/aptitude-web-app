import { Router } from "express";
import mongoose from "mongoose";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { calculateScore } from "../utils/score.js";

const router = Router();
router.use(requireAuth, requireRole("student"));

function publicQuestion(q) {
  return { _id: String(q._id ?? q.questionId), category: q.category, difficulty: q.difficulty, questionText: q.questionText, options: q.options };
}
function answerPayload(attempt) {
  return attempt.answers.map(a => ({ questionId: String(a.questionId), selectedOption: a.selectedOption }));
}
async function finalize(attempt, status = "submitted") {
  if (attempt.status !== "in_progress") return attempt;
  const questions = attempt.questionSnapshots.map(q => ({ ...q.toObject?.() ?? q, _id: q.questionId }));
  const result = calculateScore(questions, answerPayload(attempt));
  attempt.score = result.score;
  attempt.correctCount = result.correctCount;
  attempt.submittedAt = new Date();
  attempt.status = status;
  await attempt.save();
  return attempt;
}
function remainingSeconds(attempt) {
  return Math.max(0, Math.ceil((new Date(attempt.deadlineAt).getTime() - Date.now()) / 1000));
}

router.post("/start", async (req, res, next) => {
  try {
    const count = Math.max(3, Math.min(60, Number(process.env.TEST_QUESTION_COUNT || 9)));
    const duration = Math.max(1, Math.min(180, Number(process.env.TEST_DURATION_MINUTES || 30)));
    const perCategory = Math.floor(count / 3);
    const counts = [perCategory, perCategory, count - perCategory * 2];
    const categories = ["Quantitative Aptitude", "Reasoning", "Verbal/English"];
    const chosen = [];
    for (let i = 0; i < categories.length; i++) {
      const pool = await Question.find({ category: categories[i], active: true }).lean();
      if (pool.length < counts[i]) return res.status(400).json({ message: `Not enough active questions in ${categories[i]}. Add at least ${counts[i]} questions.` });
      chosen.push(...pool.sort(() => Math.random() - 0.5).slice(0, counts[i]));
    }
    chosen.sort(() => Math.random() - 0.5);
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + duration * 60 * 1000);
    const snapshots = chosen.map(q => ({
      questionId: q._id, category: q.category, difficulty: q.difficulty,
      questionText: q.questionText, options: q.options,
      correctOption: q.correctOption, explanation: q.explanation
    }));
    const attempt = await TestAttempt.create({
      studentId: req.user._id, questionIds: chosen.map(q => q._id), questionSnapshots: snapshots,
      answers: chosen.map(q => ({ questionId: q._id, selectedOption: null })),
      startedAt, deadlineAt, total: chosen.length, status: "in_progress"
    });
    res.status(201).json({
      attemptId: attempt._id, startedAt, deadlineAt, durationSeconds: duration * 60,
      questions: snapshots.map(publicQuestion), answers: answerPayload(attempt)
    });
  } catch (e) { next(e); }
});

router.get("/:attemptId/status", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.attemptId)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Test attempt not found." });
    if (attempt.status === "in_progress" && Date.now() >= new Date(attempt.deadlineAt).getTime()) await finalize(attempt, "timed_out");
    res.json({
      attemptId: attempt._id, status: attempt.status, startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt, remainingSeconds: remainingSeconds(attempt),
      questions: attempt.questionSnapshots.map(publicQuestion),
      answers: answerPayload(attempt),
      message: attempt.status === "in_progress" ? undefined : "Your test submission has been recorded. Your score will be shared by the Admin."
    });
  } catch (e) { next(e); }
});

router.put("/:attemptId/answers", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.attemptId)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Test attempt not found." });
    if (attempt.status !== "in_progress") return res.status(409).json({ message: "This test has already been submitted." });
    if (Date.now() >= new Date(attempt.deadlineAt).getTime()) {
      await finalize(attempt, "timed_out");
      return res.status(409).json({ message: "Time has expired. Your saved answers have been submitted." });
    }
    const incoming = req.body.answers;
    if (!Array.isArray(incoming)) return res.status(400).json({ message: "Answers must be an array." });
    const validIds = new Set(attempt.questionIds.map(String));
    for (const answer of incoming) {
      if (!validIds.has(String(answer.questionId))) return res.status(400).json({ message: "An answer references a question outside this test." });
      const index = attempt.answers.findIndex(a => String(a.questionId) === String(answer.questionId));
      if (index < 0) continue;
      const selected = answer.selectedOption === null || answer.selectedOption === undefined ? null : Number(answer.selectedOption);
      const q = attempt.questionSnapshots.find(q => String(q.questionId) === String(answer.questionId));
      if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected >= q.options.length)) return res.status(400).json({ message: "Invalid option selection." });
      attempt.answers[index].selectedOption = selected;
    }
    await attempt.save();
    res.json({ saved: true, remainingSeconds: remainingSeconds(attempt) });
  } catch (e) { next(e); }
});

router.post("/:attemptId/submit", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.attemptId)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Test attempt not found." });
    if (attempt.status === "in_progress") {
      const status = Date.now() >= new Date(attempt.deadlineAt).getTime() ? "timed_out" : "submitted";
      await finalize(attempt, status);
    }
    res.json({ submitted: true, status: attempt.status, message: "Your test submission has been recorded. Your score will be shared by the Admin." });
  } catch (e) { next(e); }
});

router.get("/history/list", async (req, res, next) => {
  try {
    const attempts = await TestAttempt.find({ studentId: req.user._id }).select("-score -correctCount -questionSnapshots -answers").sort({ createdAt: -1 }).limit(50);
    res.json({ attempts });
  } catch (e) { next(e); }
});

export default router;
