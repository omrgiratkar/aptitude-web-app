import { Router } from "express";
import Question from "../models/Question.js";
import PracticeAttempt from "../models/PracticeAttempt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { calculateScore } from "../utils/score.js";

const router = Router();
router.use(requireAuth, requireRole("student"));

router.get("/questions", async (req, res, next) => {
  try {
    const { category, difficulty } = req.query;
    if (!["Quantitative Aptitude", "Reasoning", "Verbal/English"].includes(category) || !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ message: "Valid category and difficulty are required." });
    }
    const questions = await Question.find({ category, difficulty, active: true }).select("category difficulty questionText options").sort({ createdAt: 1 }).limit(50);
    res.json({ questions });
  } catch (e) { next(e); }
});

router.post("/submit", async (req, res, next) => {
  try {
    const { category, difficulty, answers } = req.body;
    if (!["Quantitative Aptitude", "Reasoning", "Verbal/English"].includes(category) || !["Easy", "Medium", "Hard"].includes(difficulty) || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid practice submission." });
    }
    const ids = [...new Set(answers.map(a => String(a.questionId)))];
    const questions = await Question.find({ _id: { $in: ids }, category, difficulty, active: true });
    if (!questions.length || questions.length !== ids.length) return res.status(400).json({ message: "Question set is invalid. Please restart the practice quiz." });
    const normalizedAnswers = answers.map(a => ({ questionId: a.questionId, selectedOption: Number.isInteger(a.selectedOption) ? a.selectedOption : null }));
    const result = calculateScore(questions, normalizedAnswers);
    const attempt = await PracticeAttempt.create({
      studentId: req.user._id, category, difficulty,
      questionIds: questions.map(q => q._id), answers: normalizedAnswers,
      score: result.score, total: result.total, correctCount: result.correctCount
    });
    res.status(201).json({ attemptId: attempt._id, ...result });
  } catch (e) { next(e); }
});

router.get("/attempts", async (req, res, next) => {
  try {
    const attempts = await PracticeAttempt.find({ studentId: req.user._id }).sort({ submittedAt: -1 }).limit(50);
    res.json({ attempts });
  } catch (e) { next(e); }
});

export default router;
