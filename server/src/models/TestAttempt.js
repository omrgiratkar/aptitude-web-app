import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: Number, default: null }
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  questionSnapshots: [{
    questionId: mongoose.Schema.Types.ObjectId,
    category: String,
    difficulty: String,
    questionText: String,
    options: [String],
    correctOption: Number,
    explanation: String
  }],
  answers: [answerSchema],
  startedAt: { type: Date, required: true },
  deadlineAt: { type: Date, required: true },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ["in_progress", "submitted", "timed_out"], default: "in_progress", index: true },
  score: { type: Number, default: null },
  total: { type: Number, required: true },
  correctCount: { type: Number, default: null },
  releasedAt: { type: Date, default: null },
  scorecardEmailSentAt: { type: Date, default: null },
  scorecardEmailStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" }
}, { timestamps: true });

export default mongoose.model("TestAttempt", testAttemptSchema);
