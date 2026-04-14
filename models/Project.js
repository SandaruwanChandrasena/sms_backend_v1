import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    // basic project info
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // supervisor who owns this project
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // percentage allocated for proposal (e.g. 25)
    // remaining (100 - proposalPercentage) is split across tasks
    proposalPercentage: { type: Number, required: true, min: 0, max: 100 },

    // deadline for students to submit their proposal
    proposalDeadline: { type: Date, required: true },

    // supervisor toggles these fields ON/OFF for the proposal template
    proposalTemplate: {
      objective: { type: Boolean, default: true },
      proposedApproach: { type: Boolean, default: true },
      timeline: { type: Boolean, default: true },
      technologiesUsed: { type: Boolean, default: false },
      softwareUsed: { type: Boolean, default: false },
      references: { type: Boolean, default: false },
      expectedOutcomes: { type: Boolean, default: false },
      additionalNotes: { type: Boolean, default: false },
    },

    // draft = only supervisor sees it, published = students can see and apply
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
);

export default mongoose.model("Project", projectSchema);
