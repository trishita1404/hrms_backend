const Notification = require('../model/Notification');

/**
 * Sends a real-time notification and saves it to the database
 * @param {Object} io - The Socket.io instance from app.set('io')
 * @param {Object} data - Notification details
 */
const createNotification = async (io, { recipient, sender, type, message, link }) => {
  try {
    // 1. Save to Database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      link
    });

    // 2. Check if user is online in our global "Phonebook"
    const recipientSocketId = global.activeUsers.get(recipient.toString());

    if (recipientSocketId) {
      // 3. Send real-time message only to that specific user
      io.to(recipientSocketId).emit('new_notification', {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        isRead: false
      });
      console.log(`📡 Real-time alert sent to user: ${recipient}`);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = { createNotification }; 