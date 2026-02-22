const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: String,
    experience: String,
    score: String,
    feedback: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
