export class CreateNotificationDto {
  orderId: string;
  type: string;
  channel: string;
  recipient: string;
  subject?: string;
  message: string;
}

export class OrderCreatedEvent {
  orderId: string;
  userId: string;
  total: number;
  status: string;
}

export class PaymentCompletedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  transactionId: string;
}

