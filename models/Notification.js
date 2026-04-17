import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({

  // who receives this notification
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // type helps frontend show different icons per notification
  type: {
    type: String,
    enum: [
      'project_published',
      'proposal_submitted',
      'proposal_accepted',
      'proposal_rejected',
      'submission_received',
      'submission_reviewed',
      'deadline_reminder',
    ],
    required: true,
  },

  message: { type: String, required: true },

  // false = unread (shows red dot), true = read
  isRead: { type: Boolean, default: false },

  // optional — link to the related item for frontend navigation
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },

}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);