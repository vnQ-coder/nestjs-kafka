import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Notification, NotificationType, NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.create({
      orderId: dto.orderId,
      type: dto.type as NotificationType,
      channel: dto.channel as NotificationChannel,
      recipient: dto.recipient,
      subject: dto.subject,
      message: dto.message,
      status: 'PENDING',
    });

    // Simulate sending notification
    await this.sendNotification(notification);

    return notification;
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async getAllNotifications(): Promise<Notification[]> {
    return this.notificationRepository.findAll();
  }

  async getNotificationsByOrderId(orderId: string): Promise<Notification[]> {
    return this.notificationRepository.findByOrderId(orderId);
  }

  async sendNotification(notification: Notification): Promise<void> {
    console.log(`📧 Sending ${notification.channel} notification:`, notification.message);
    
    // Simulate async notification sending
    setTimeout(async () => {
      try {
        await this.notificationRepository.markAsSent(notification.id);
        console.log(`✅ Notification sent successfully: ${notification.id}`);
      } catch (error) {
        console.error(`❌ Failed to send notification: ${notification.id}`, error);
        await this.notificationRepository.updateStatus(notification.id, 'FAILED');
      }
    }, 500);
  }

  async handleOrderCreated(orderId: string, userId: string, userEmail: string): Promise<Notification> {
    return this.createNotification({
      orderId,
      type: 'ORDER_CREATED',
      channel: 'EMAIL',
      recipient: userEmail,
      subject: 'Order Confirmation',
      message: `Your order ${orderId} has been created successfully!`,
    });
  }

  async handlePaymentCompleted(orderId: string, paymentId: string, userEmail: string): Promise<Notification> {
    return this.createNotification({
      orderId,
      type: 'PAYMENT_COMPLETED',
      channel: 'EMAIL',
      recipient: userEmail,
      subject: 'Payment Successful',
      message: `Your payment ${paymentId} has been processed successfully!`,
    });
  }
}

