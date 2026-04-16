import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    // which project this proposal is for
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // student who submitted this proposal
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // the filled proposal data — only fields supervisor turned ON
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

    // pending = waiting for review, accepted = approved, rejected = not approved
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    // 5 if submitted before deadline, 0 if late — assigned automatically
    systemMark: { type: Number, default: 0 },

    // mark given by supervisor manually
    supervisorMark: { type: Number, default: 0 },

    // feedback from supervisor
    feedback: { type: String, default: "" },

    // tracks how many times student resubmitted after rejection
    resubmissionCount: { type: Number, default: 0 },

    // when the student submitted
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Proposal", proposalSchema);
