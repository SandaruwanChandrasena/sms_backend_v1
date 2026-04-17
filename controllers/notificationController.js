import Notification from '../models/Notification.js';

// GET /api/notifications — get all notifications for logged-in user
export const getNotifications = async (req, res, next) => {
  try {
    // newest first
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count — get unread count for bell icon
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read — mark single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    // prevent user from marking someone else's notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all — mark all as read at once
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id — delete a single notification
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};