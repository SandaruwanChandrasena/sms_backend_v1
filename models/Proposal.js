import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    proposalData: {
      objective: { type: String, default: "" },
      proposedApproach: { type: String, default: "" },
      timeline: { type: String, default: "" },
      technologiesUsed: { type: String, default: "" },
      softwareUsed: { type: String, default: "" },
      references: { type: String, default: "" },
      expectedOutcomes: { type: String, default: "" },
      additionalNotes: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    // 5 if on time, 0 if late
    systemMark: { type: Number, default: 0 },

    // reason why system gave 0 — shown to student
    systemMarkReason: { type: String, default: "" },

    // mark given by supervisor
    supervisorMark: { type: Number, default: 0 },

    // systemMark + supervisorMark
    totalMark: { type: Number, default: 0 },

    feedback: { type: String, default: "" },
    resubmissionCount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Proposal", proposalSchema);
