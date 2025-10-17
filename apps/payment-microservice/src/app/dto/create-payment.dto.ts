export class CreatePaymentDto {
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export class ProcessPaymentDto {
  paymentId: string;
  orderId: string;
  amount: number;
}

export class UpdatePaymentStatusDto {
  paymentId: string;
  status: string;
  transactionId?: string;
}

