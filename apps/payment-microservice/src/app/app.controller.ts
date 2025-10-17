import { Controller, Inject } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './services/payment.service';
import { CreatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';

@Controller()
export class AppController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @MessagePattern('payment.create')
  async createPayment(@Payload() data: CreatePaymentDto) {
    console.log('💳 Creating payment:', data);
    try {
      const payment = await this.paymentService.createPayment(data);
      console.log('✅ Payment created:', payment.id);
      return { 
        success: true, 
        data: payment,
        message: 'Payment created successfully' 
      };
    } catch (error) {
      console.error('❌ Error creating payment:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @MessagePattern('payment.process')
  async processPayment(@Payload() data: ProcessPaymentDto) {
    console.log('💳 Processing payment:', data);
    try {
      const payment = await this.paymentService.processPayment(data);
      console.log('✅ Payment processed:', payment.id, payment.status);
      
      // Emit event based on payment status
      if (payment.status === 'COMPLETED') {
        this.kafkaClient.emit('payment.completed', {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          transactionId: payment.transactionId,
          status: payment.status,
        });
      } else if (payment.status === 'FAILED') {
        this.kafkaClient.emit('payment.failed', {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
        });
      }
      
      return { 
        success: true, 
        data: payment 
      };
    } catch (error) {
      console.error('❌ Error processing payment:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @MessagePattern('payment.findById')
  async getPaymentById(@Payload() data: { id: string }) {
    console.log('💳 Fetching payment:', data.id);
    try {
      const payment = await this.paymentService.getPaymentById(data.id);
      return { success: true, data: payment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('payment.findAll')
  async getAllPayments() {
    console.log('💳 Fetching all payments');
    try {
      const payments = await this.paymentService.getAllPayments();
      return { 
        success: true, 
        data: payments,
        count: payments.length 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('payment.findByOrderId')
  async getPaymentByOrderId(@Payload() data: { orderId: string }) {
    console.log('💳 Fetching payment for order:', data.orderId);
    try {
      const payment = await this.paymentService.getPaymentByOrderId(data.orderId);
      return { success: true, data: payment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('payment.refund')
  async refundPayment(@Payload() data: { paymentId: string }) {
    console.log('💳 Refunding payment:', data.paymentId);
    try {
      const payment = await this.paymentService.refundPayment(data.paymentId);
      
      // Emit refund event
      this.kafkaClient.emit('payment.refunded', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });
      
      return { success: true, data: payment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
