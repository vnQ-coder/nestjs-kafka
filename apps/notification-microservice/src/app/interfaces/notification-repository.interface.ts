import { Notification, NotificationStatus, NotificationType, NotificationChannel } from '@prisma/client';

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findAll(): Promise<Notification[]>;
  findByOrderId(orderId: string): Promise<Notification[]>;
  updateStatus(id: string, status: NotificationStatus): Promise<Notification>;
  markAsSent(id: string): Promise<Notification>;
}

export interface CreateNotificationData {
  orderId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  status?: NotificationStatus;
}

