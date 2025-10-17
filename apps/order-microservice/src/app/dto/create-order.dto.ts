export class CreateOrderDto {
  userId: string;
  total: number;
}

export class OrderCreatedEvent {
  orderId: string;
  userId: string;
  total: number;
  status: string;
}

export class UpdateOrderStatusDto {
  orderId: string;
  status: string;
}

