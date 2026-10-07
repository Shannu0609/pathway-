import { dbFind, dbFindOne, dbUpdate } from '../config/database.js';

export const getNotifications = async (req, res) => {
  const items = await dbFind('notifications', req.user.role === 'admin' ? {} : { userId: req.user.id });
  res.json(items);
};

export const markNotificationRead = async (req, res) => {
  const query = req.user.role === 'admin'
    ? { id: req.params.id }
    : { id: req.params.id, userId: req.user.id };
  const notification = await dbFindOne('notifications', query);
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }
  const result = await dbUpdate('notifications', { _id: notification._id }, { $set: { read: true } });
  res.json({ message: 'Notification marked as read.', notification: result.updatedDoc });
};
