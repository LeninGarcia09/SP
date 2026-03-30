import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ProductCategory, RecurringInterval } from '@telnub/shared';

export class CreateProductDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProductCategory, default: ProductCategory.SERVICE })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  family?: string;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ maxLength: 3, default: 'USD' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ maxLength: 50, default: 'unit' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurringInterval })
  @IsEnum(RecurringInterval)
  @IsOptional()
  recurringInterval?: RecurringInterval;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxDiscount?: number;

  @ApiPropertyOptional({ default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  family?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ maxLength: 3 })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurringInterval })
  @IsEnum(RecurringInterval)
  @IsOptional()
  recurringInterval?: RecurringInterval;

  @ApiPropertyOptional({ minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
