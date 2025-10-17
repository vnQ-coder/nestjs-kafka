import { Injectable } from '@nestjs/common';
import { PrismaService } from '@kafka2/prisma';
import { Payment, PaymentStatus } from '@prisma/client';
import { IPaymentRepository, CreatePaymentData } from '../interfaces/payment-repository.interface';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
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

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
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

  async findAll(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
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

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        order: true,
      },
    });
  }

  async updateTransactionId(id: string, transactionId: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { transactionId },
      include: {
        order: true,
      },
    });
  }
}

