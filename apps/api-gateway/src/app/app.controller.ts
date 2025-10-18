import { Body, Controller, Get, Inject, Post, Param, OnModuleInit, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserDto, CreateOrderDto, CreatePaymentDto } from './dto';
import { firstValueFrom, timeout } from 'rxjs';
import { PrismaService } from '@kafka2/prisma';

@ApiTags('Health')
@Controller()
export class AppController implements OnModuleInit {
  constructor(
    private readonly appService: AppService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Subscribe to response topics
    const requestPatterns = [
      'order.create', 'order.findAll', 'order.findById', 'order.findByUserId', 'order.findWithPagination',
      'payment.create', 'payment.process', 'payment.findAll', 'payment.findByOrderId',
      'notification.findAll', 'notification.findByOrderId'
    ];
    
    requestPatterns.forEach(pattern => {
      this.kafkaClient.subscribeToResponseOf(pattern);
    });
    
    await this.kafkaClient.connect();
  }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getData() {
    return this.appService.getData();
  }

  // User endpoints (keeping local for now - can be moved to user microservice)
  @ApiTags('Users')
  @Post('users')
  @ApiOperation({ summary: 'Create a new user - Direct DB access (for now)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createUser(@Body() _data: CreateUserDto) {
    // Note: User management would typically be in a separate microservice
    // For now, keeping it in API Gateway for simplicity
    // In production, this should also go through a User microservice
    throw new HttpException(
      'User service not implemented yet - please create user via Prisma Studio or seed script',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @ApiTags('Users')
  @Get('users')
  @ApiOperation({ summary: 'Get all users with their orders' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  async getUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        orders: true,
      },
    });
    return { users, count: users.length };
  }

  @ApiTags('Users')
  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID with full details' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            payment: true,
            notifications: true,
          },
        },
      },
    });
    return { user };
  }

  // Order endpoints
  @ApiTags('Orders')
  @Post('orders')
  @ApiOperation({ summary: 'Create a new order via order microservice' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async createOrder(@Body() data: CreateOrderDto) {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('order.create', data)
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to create order', HttpStatus.BAD_REQUEST);
      }
      
      return { 
        message: 'Order created successfully', 
        order: response.data 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Order service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }

  @ApiTags('Orders')
  @Get('orders')
  @ApiOperation({ 
    summary: 'Get orders with cursor-based pagination',
    description: `
      Get orders with cursor-based pagination, sorting, and filtering.
      
      Query Parameters:
      - cursor: The cursor from the previous page (use nextCursor or previousCursor from response)
      - limit: Number of items per page (default: 10)
      - sortBy: Field to sort by (createdAt, updatedAt, total, status)
      - sortOrder: Sort direction (asc, desc)
      - userId: Filter by user ID
      - status: Filter by order status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
      - select: Comma-separated fields to select (e.g., id,total,status)
    `
  })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'total', 'status'], description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'select', required: false, description: 'Comma-separated fields to select' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getOrders(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('select') select?: string,
  ) {
    try {
      // Build pagination query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paginationQuery: Record<string, any> = {};
      if (cursor) paginationQuery.cursor = cursor;
      if (limit) paginationQuery.limit = Number(limit);
      if (sortBy) paginationQuery.sortBy = sortBy;
      if (sortOrder) paginationQuery.sortOrder = sortOrder;
      if (userId) paginationQuery.userId = userId;
      if (status) paginationQuery.status = status;
      if (select) paginationQuery.select = select.split(',').map(s => s.trim());

      const response = await firstValueFrom(
        this.kafkaClient
          .send('order.findWithPagination', paginationQuery)
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to fetch orders', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { 
        orders: response.data, 
        pagination: response.pagination
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Order service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }

  @ApiTags('Orders')
  @Get('orders/all')
  @ApiOperation({ summary: 'Get all orders (without pagination) via order microservice' })
  @ApiResponse({ status: 200, description: 'Returns all orders' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getAllOrders() {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('order.findAll', {})
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to fetch orders', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { 
        orders: response.data, 
        count: response.count 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Order service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }

  @ApiTags('Orders')
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID via order microservice' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getOrder(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('order.findById', { id })
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Order not found', HttpStatus.NOT_FOUND);
      }
      
      return { order: response.data };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Order service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }

  // Payment endpoints
  @ApiTags('Payments')
  @Post('payments')
  @ApiOperation({ summary: 'Create and process payment via payment microservice' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async processPayment(@Body() data: CreatePaymentDto) {
    try {
      // First create the payment
      const createResponse = await firstValueFrom(
        this.kafkaClient
          .send('payment.create', {
            orderId: data.orderId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
          })
          .pipe(timeout(5000))
      );
      
      if (!createResponse.success) {
        throw new HttpException(createResponse.error || 'Failed to create payment', HttpStatus.BAD_REQUEST);
      }
      
      // Then process the payment
      const processResponse = await firstValueFrom(
        this.kafkaClient
          .send('payment.process', {
            paymentId: createResponse.data.id,
            orderId: data.orderId,
            amount: data.amount,
          })
          .pipe(timeout(10000)) // Longer timeout for payment processing
      );
      
      if (!processResponse.success) {
        throw new HttpException(processResponse.error || 'Failed to process payment', HttpStatus.BAD_REQUEST);
      }
      
      return { 
        message: 'Payment processed successfully', 
        payment: processResponse.data 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Payment service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }

  @ApiTags('Payments')
  @Get('payments')
  @ApiOperation({ summary: 'Get all payments via payment microservice' })
  @ApiResponse({ status: 200, description: 'Returns all payments' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getPayments() {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('payment.findAll', {})
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to fetch payments', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { 
        payments: response.data, 
        count: response.count 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Payment service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }
  
  @ApiTags('Payments')
  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID via payment microservice' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Returns payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getPayment(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('payment.findById', { id })
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Payment not found', HttpStatus.NOT_FOUND);
      }
      
      return { payment: response.data };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Payment service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }
  
  @ApiTags('Payments')
  @Get('payments/order/:orderId')
  @ApiOperation({ summary: 'Get payment by order ID via payment microservice' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('payment.findByOrderId', { orderId })
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Payment not found', HttpStatus.NOT_FOUND);
      }
      
      return { payment: response.data };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Payment service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }
  
  @ApiTags('Notifications')
  @Get('notifications')
  @ApiOperation({ summary: 'Get all notifications via notification microservice' })
  @ApiResponse({ status: 200, description: 'Returns all notifications' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getNotifications() {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('notification.findAll', {})
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to fetch notifications', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { 
        notifications: response.data, 
        count: response.count 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Notification service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }
  
  @ApiTags('Notifications')
  @Get('notifications/order/:orderId')
  @ApiOperation({ summary: 'Get notifications by order ID via notification microservice' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns notifications' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getNotificationsByOrderId(@Param('orderId') orderId: string) {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('notification.findByOrderId', { orderId })
          .pipe(timeout(5000))
      );
      
      if (!response.success) {
        throw new HttpException(response.error || 'Failed to fetch notifications', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return { 
        notifications: response.data, 
        count: response.count 
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new HttpException('Request timeout - Notification service not responding', HttpStatus.REQUEST_TIMEOUT);
      }
      throw error;
    }
  }
}
