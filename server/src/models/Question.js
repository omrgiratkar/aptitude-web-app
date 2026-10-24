import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  category: { type: String, enum: ["Quantitative Aptitude", "Reasoning", "Verbal/English"], required: true, index: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true, index: true },
  questionText: { type: String, required: true, trim: true, maxlength: 2000 },
  options: {
    type: [{ type: String, required: true, trim: true }],
    validate: v => Array.isArray(v) && v.length >= 2 && v.length <= 6
  },
  correctOption: { type: Number, required: true, min: 0 },
  explanation: { type: String, required: true, trim: true, maxlength: 3000 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

questionSchema.pre("validate", function(next) {
  if (this.correctOption >= this.options.length) this.invalidate("correctOption", "Correct option must refer to an existing option.");
  next();
});

export default mongoose.model("Question", questionSchema);
