import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repositories/order.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/create-order.dto';
import { Order, OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.orderRepository.create({
      userId: dto.userId,
      total: dto.total,
      status: 'PENDING',
    });
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrderStatus(dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.getOrderById(dto.orderId);
    return this.orderRepository.updateStatus(dto.orderId, dto.status as OrderStatus);
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, 'CONFIRMED');
  }

  async processOrder(orderId: string): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, 'PROCESSING');
  }

  async shipOrder(orderId: string): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, 'SHIPPED');
  }

  async deliverOrder(orderId: string): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, 'DELIVERED');
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, 'CANCELLED');
  }
}

