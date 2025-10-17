import { Injectable } from '@nestjs/common';
import { PrismaService } from '@kafka2/prisma';
import { Notification, NotificationStatus } from '@prisma/client';
import { INotificationRepository, CreateNotificationData } from '../interfaces/notification-repository.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        orderId: data.orderId,
        type: data.type,
        channel: data.channel,
        recipient: data.recipient,
        subject: data.subject,
        message: data.message,
        status: data.status || 'PENDING',
      },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { orderId },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { status },
      include: {
        order: true,
      },
    });
  }

  async markAsSent(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        order: true,
      },
    });
  }
}

