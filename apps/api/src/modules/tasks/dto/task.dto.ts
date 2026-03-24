import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { TaskStatus, Priority } from '@telnub/shared';

export class CreateTaskDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'Work start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'Required end date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualHours?: number | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  parentTaskId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Deliverable this task belongs to' })
  @IsUUID()
  @IsOptional()
  deliverableId?: string | null;

  @ApiPropertyOptional({ minimum: 0, description: 'Per-task cost rate override ($/hr). Uses project rate if null.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costRate?: number | null;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'Work start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'Required end date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualHours?: number | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  parentTaskId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Deliverable this task belongs to' })
  @IsUUID()
  @IsOptional()
  deliverableId?: string | null;

  @ApiPropertyOptional({ minimum: 0, description: 'Per-task cost rate override ($/hr). Uses project rate if null.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costRate?: number | null;
}

export class CreateTaskCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  comment: string;
}
