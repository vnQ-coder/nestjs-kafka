import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './services/notification.service';
import { CreateNotificationDto, OrderCreatedEvent, PaymentCompletedEvent } from './dto/create-notification.dto';

@Controller()
export class AppController {
  constructor(private readonly notificationService: NotificationService) {}

  // Event handlers
  @MessagePattern('order.created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    console.log('📧 Order created event received:', data.orderId);
    try {
      // Fetch user email from order (would normally come with event)
      const notification = await this.notificationService.handleOrderCreated(
        data.orderId,
        data.userId,
        'user@example.com' // Would get from user service
      );
      return { success: true, data: notification };
    } catch (error) {
      console.error('❌ Error handling order created:', error.message);
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('payment.completed')
  async handlePaymentCompleted(@Payload() data: PaymentCompletedEvent) {
    console.log('📧 Payment completed event received:', data.paymentId);
    try {
      const notification = await this.notificationService.handlePaymentCompleted(
        data.orderId,
        data.paymentId,
        'user@example.com' // Would get from user service
      );
      return { success: true, data: notification };
    } catch (error) {
      console.error('❌ Error handling payment completed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Request-response patterns
  @MessagePattern('notification.create')
  async createNotification(@Payload() data: CreateNotificationDto) {
    console.log('📧 Creating notification:', data);
    try {
      const notification = await this.notificationService.createNotification(data);
      return { success: true, data: notification };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('notification.findByOrderId')
  async getNotificationsByOrderId(@Payload() data: { orderId: string }) {
    console.log('📧 Fetching notifications for order:', data.orderId);
    try {
      const notifications = await this.notificationService.getNotificationsByOrderId(data.orderId);
      return { success: true, data: notifications, count: notifications.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('notification.findAll')
  async getAllNotifications() {
    console.log('📧 Fetching all notifications');
    try {
      const notifications = await this.notificationService.getAllNotifications();
      return { success: true, data: notifications, count: notifications.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
