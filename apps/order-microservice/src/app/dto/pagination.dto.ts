import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TOTAL = 'total',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string; // The cursor value (ID of the last item from previous page)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10; // Number of items to fetch

  @IsOptional()
  @IsEnum(OrderSortField)
  sortBy?: OrderSortField = OrderSortField.CREATED_AT; // Field to sort by

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC; // Sort direction

  @IsOptional()
  @IsString()
  userId?: string; // Filter by user ID

  @IsOptional()
  @IsString()
  status?: string; // Filter by order status

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  select?: string[]; // Fields to select (e.g., ['id', 'total', 'status'])
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
    count: number;
  };
}

