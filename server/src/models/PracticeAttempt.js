import mongoose from "mongoose";

const practiceAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, enum: ["Quantitative Aptitude", "Reasoning", "Verbal/English"], required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  answers: [{ questionId: mongoose.Schema.Types.ObjectId, selectedOption: Number }],
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("PracticeAttempt", practiceAttemptSchema);
