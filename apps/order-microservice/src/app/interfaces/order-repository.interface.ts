import { Order, OrderStatus } from '@prisma/client';

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findByUserId(userId: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  delete(id: string): Promise<void>;
}

export interface CreateOrderData {
  userId: string;
  total: number;
  status?: OrderStatus;
}

