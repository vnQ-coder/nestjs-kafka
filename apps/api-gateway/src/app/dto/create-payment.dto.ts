import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Order ID to process payment for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'credit_card',
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
  paymentMethod: string;
}

