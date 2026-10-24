import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "admin"], default: "student", required: true },
  gender: { type: String, enum: ["Female", "Male", "Non-binary", "Prefer not to say"], required: function(){ return this.role === "student"; } },
  department: { type: String, trim: true, required: function(){ return this.role === "student"; } },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
