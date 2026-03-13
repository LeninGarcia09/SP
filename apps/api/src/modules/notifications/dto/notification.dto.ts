import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsEnum, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { NotificationType } from '@bizops/shared';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  relatedEntityType?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  relatedEntityId?: string | null;
}

export class MarkReadDto {
  @ApiProperty()
  @IsBoolean()
  isRead: boolean;
}
