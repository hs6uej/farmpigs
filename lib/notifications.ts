import { prisma } from './prisma';

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK';

interface CreateNotificationParams {
  userId?: string | null; // null = broadcast to all
  title: string;
  message: string;
  type?: NotificationType;
  category?: string;
  link?: string;
}

// สร้าง notification
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId || null,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        category: params.category || null,
        link: params.link || null,
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// สร้าง notification สำหรับทุกคน (broadcast)
export async function broadcastNotification(params: Omit<CreateNotificationParams, 'userId'>) {
  return createNotification({ ...params, userId: null });
}

// สร้าง notification สำหรับ admin ทุกคน
export async function notifyAdmins(params: Omit<CreateNotificationParams, 'userId'>) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification({ ...params, userId: admin.id })
      )
    );

    return notifications.filter(Boolean);
  } catch (error) {
    console.error('Failed to notify admins:', error);
    return [];
  }
}

// ดึง notifications สำหรับ user
export async function getNotificationsForUser(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null }, // broadcast notifications
        ],
        ...(options?.unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

// นับ unread notifications
export async function countUnreadNotifications(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        OR: [
          { userId: userId },
          { userId: null },
        ],
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error('Failed to count unread notifications:', error);
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string, userId: string) {
  try {
    // Check if notification belongs to user or is broadcast
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId: userId },
          { userId: null },
        ],
      },
    });

    if (!notification) return null;

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
}

// Mark all notifications as read for user
export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null },
        ],
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return false;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    // Only delete if belongs to user or is broadcast
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId: userId },
          { userId: null },
        ],
      },
    });

    if (!notification) return false;

    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return true;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return false;
  }
}

// Clear all read notifications for user
export async function clearReadNotifications(userId: string) {
  try {
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null },
        ],
        isRead: true,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to clear read notifications:', error);
    return false;
  }
}

// Cleanup old notifications (older than 30 days)
export async function cleanupOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
    return 0;
  }
}
