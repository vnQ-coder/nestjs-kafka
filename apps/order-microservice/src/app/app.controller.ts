import { Controller, Inject } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { PaginationQueryDto } from './dto/pagination.dto';

@Controller()
export class AppController {
  constructor(
    private readonly orderService: OrderService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @MessagePattern('order.create')
  async createOrder(@Payload() data: CreateOrderDto) {
    console.log('📦 Creating order:', data);
    try {
      const order = await this.orderService.createOrder(data);
      console.log('✅ Order created:', order.id);
      
      // Emit event for notification service
      this.kafkaClient.emit('order.created', {
        orderId: order.id,
        userId: order.userId,
        total: order.total,
        status: order.status,
      });
      
      return { 
        success: true, 
        data: order,
        message: 'Order created successfully' 
      };
    } catch (error) {
      console.error('❌ Error creating order:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @MessagePattern('order.findById')
  async getOrderById(@Payload() data: { id: string }) {
    console.log('📦 Fetching order:', data.id);
    try {
      const order = await this.orderService.getOrderById(data.id);
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('order.findAll')
  async getAllOrders() {
    console.log('📦 Fetching all orders');
    try {
      const orders = await this.orderService.getAllOrders();
      return { 
        success: true, 
        data: orders,
        count: orders.length 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('order.findWithPagination')
  async getOrdersWithPagination(@Payload() query: PaginationQueryDto) {
    console.log('📦 Fetching orders with pagination:', query);
    try {
      const result = await this.orderService.getOrdersWithPagination(query);
      return { 
        success: true, 
        ...result
      };
    } catch (error) {
      console.error('❌ Error fetching paginated orders:', error.message);
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('order.findByUserId')
  async getOrdersByUserId(@Payload() data: { userId: string }) {
    console.log('📦 Fetching orders for user:', data.userId);
    try {
      const orders = await this.orderService.getOrdersByUserId(data.userId);
      return { success: true, data: orders, count: orders.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('order.updateStatus')
  async updateOrderStatus(@Payload() data: UpdateOrderStatusDto) {
    console.log('📦 Updating order status:', data);
    try {
      const order = await this.orderService.updateOrderStatus(data);
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Event handlers
  @MessagePattern('payment.completed')
  async handlePaymentCompleted(@Payload() data: any) {
    console.log('💳 Payment completed for order:', data.orderId);
    try {
      const order = await this.orderService.confirmOrder(data.orderId);
      
      // Notify other services
      this.kafkaClient.emit('order.confirmed', {
        orderId: order.id,
        userId: order.userId,
        status: order.status,
      });
      
      return { success: true, data: order };
    } catch (error) {
      console.error('❌ Error handling payment completion:', error.message);
      return { success: false, error: error.message };
    }
  }
}
