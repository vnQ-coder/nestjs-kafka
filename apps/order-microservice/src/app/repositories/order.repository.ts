import { Injectable } from '@nestjs/common';
import { PrismaService } from '@kafka2/prisma';
import { Order, OrderStatus } from '@prisma/client';
import { IOrderRepository, CreateOrderData } from '../interfaces/order-repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderData): Promise<Order> {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        status: data.status || 'PENDING',
      },
      include: {
        user: true,
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        payment: true,
        notifications: true,
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        user: true,
        payment: true,
        notifications: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        user: true,
        payment: true,
        notifications: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        payment: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id },
    });
  }
}

