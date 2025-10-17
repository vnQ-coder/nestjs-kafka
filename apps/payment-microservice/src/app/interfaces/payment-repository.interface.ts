import { Payment, PaymentStatus } from '@prisma/client';

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment>;
  updateTransactionId(id: string, transactionId: string): Promise<Payment>;
}

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  status?: PaymentStatus;
}

