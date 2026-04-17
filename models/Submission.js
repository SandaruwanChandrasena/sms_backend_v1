import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    // which task this submission belongs to
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // student who submitted
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // file details saved by multer
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },

    // true if submitted after deadline but within 30 mins
    isLate: { type: Boolean, default: false },

    // 5 if on time, 0 if late — assigned automatically
    systemMark: { type: Number, default: 0 },

    // reason why system gave 0
    systemMarkReason: { type: String, default: "" },

    // mark given by supervisor
    supervisorMark: { type: Number, default: 0 },

    // systemMark + supervisorMark
    totalMark: { type: Number, default: 0 },

    feedback: { type: String, default: "" },

    // when student submitted
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Submission", submissionSchema);
