import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // which project this task belongs to
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true },

    // display order of task under the project (Task 1, Task 2...)
    order: { type: Number, default: 1 },

    // auto calculated: (100 - proposalPercentage) / taskCount
    totalMarks: { type: Number, default: 0 },

    // true = students can submit, false = link closed (auto after 30 mins past deadline)
    submissionOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Task", taskSchema);
