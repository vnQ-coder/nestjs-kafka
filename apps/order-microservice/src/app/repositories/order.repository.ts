import { Injectable } from '@nestjs/common';
import { PrismaService } from '@kafka2/prisma';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { IOrderRepository, CreateOrderData } from '../interfaces/order-repository.interface';
import { PaginatedResponse, PaginationQueryDto, OrderSortField } from '../dto/pagination.dto';

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

  async findWithPagination(query: PaginationQueryDto): Promise<PaginatedResponse<Order>> {
    const {
      cursor,
      limit = 10,
      sortBy = OrderSortField.CREATED_AT,
      sortOrder = 'desc',
      userId,
      status,
      select,
    } = query;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status as OrderStatus;
    }

    // Build select clause if provided
    let selectClause: Prisma.OrderSelect | undefined;
    if (select && select.length > 0) {
      selectClause = {} as Prisma.OrderSelect;
      select.forEach((field) => {
        if (selectClause) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (selectClause as Record<string, any>)[field] = true;
        }
      });
      // Always include id for cursor pagination
      if (selectClause && !selectClause.id) {
        selectClause.id = true;
      }
      // Always include the sort field
      const selectRecord = selectClause as Record<string, boolean>;
      if (selectClause && !selectRecord[sortBy]) {
        selectRecord[sortBy] = true;
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Add secondary sort by id for consistent ordering
    if (sortBy !== OrderSortField.CREATED_AT && sortBy !== OrderSortField.UPDATED_AT) {
      orderBy.id = sortOrder;
    }

    // Fetch limit + 1 to check if there's a next page
    const take = limit + 1;

    // Build cursor clause
    let cursorClause: { id: string } | undefined;
    if (cursor) {
      cursorClause = { id: cursor };
    }

    // Fetch orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orders: any[];
    if (selectClause) {
      orders = await this.prisma.order.findMany({
        where,
        select: selectClause,
        orderBy,
        take,
        ...(cursorClause ? { skip: 1, cursor: cursorClause } : {}),
      });
    } else {
      orders = await this.prisma.order.findMany({
        where,
        include: {
          user: true,
          payment: true,
          notifications: true,
        },
        orderBy,
        take,
        ...(cursorClause ? { skip: 1, cursor: cursorClause } : {}),
      });
    }

    // Check if there's a next page
    const hasNextPage = orders.length > limit;
    if (hasNextPage) {
      orders.pop(); // Remove the extra item
    }

    // Get previous cursor (the cursor of the first item)
    const hasPreviousPage = !!cursor;
    const nextCursor = hasNextPage && orders.length > 0 ? orders[orders.length - 1].id : null;
    const previousCursor = hasPreviousPage && orders.length > 0 ? orders[0].id : null;

    return {
      data: orders as Order[],
      pagination: {
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        previousCursor,
        count: orders.length,
      },
    };
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

