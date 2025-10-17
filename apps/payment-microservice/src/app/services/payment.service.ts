import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreatePaymentDto, ProcessPaymentDto } from '../dto/create-payment.dto';
import { Payment, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    return this.paymentRepository.create({
      orderId: dto.orderId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      status: 'PENDING',
    });
  }

  async processPayment(dto: ProcessPaymentDto): Promise<Payment> {
    // Find existing payment or create new one
    let payment = await this.paymentRepository.findByOrderId(dto.orderId);
    
    if (!payment) {
      throw new NotFoundException(`Payment for order ${dto.orderId} not found`);
    }

    // Simulate payment processing
    payment = await this.paymentRepository.updateStatus(payment.id, 'PROCESSING');
    
    // Simulate external payment gateway call
    const success = await this.simulatePaymentGateway(dto.amount);
    
    if (success) {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      payment = await this.paymentRepository.updateTransactionId(payment.id, transactionId);
      payment = await this.paymentRepository.updateStatus(payment.id, 'COMPLETED');
    } else {
      payment = await this.paymentRepository.updateStatus(payment.id, 'FAILED');
    }

    return payment;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.findAll();
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }
    return payment;
  }

  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);
    return this.paymentRepository.updateStatus(paymentId, 'REFUNDED');
  }

  private async simulatePaymentGateway(amount: number): Promise<boolean> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }
}

