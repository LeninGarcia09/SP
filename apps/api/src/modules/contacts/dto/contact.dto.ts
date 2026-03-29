import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  IsObject,
  IsEmail,
} from 'class-validator';
import { ContactChannel, ContactType, ContactInfluence } from '@telnub/shared';

export class CreateContactDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsEmail()
  @MaxLength(200)
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  mobilePhone?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  department?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  reportsToId?: string;

  @ApiPropertyOptional({ enum: ContactChannel, default: ContactChannel.EMAIL })
  @IsEnum(ContactChannel)
  @IsOptional()
  preferredChannel?: ContactChannel;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ maxLength: 10, default: 'en' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ enum: ContactType, default: ContactType.OTHER })
  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @ApiPropertyOptional({ enum: ContactInfluence })
  @IsEnum(ContactInfluence)
  @IsOptional()
  influence?: ContactInfluence;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsEmail()
  @MaxLength(200)
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  mobilePhone?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  reportsToId?: string;

  @ApiPropertyOptional({ enum: ContactChannel })
  @IsEnum(ContactChannel)
  @IsOptional()
  preferredChannel?: ContactChannel;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ maxLength: 10 })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ enum: ContactType })
  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @ApiPropertyOptional({ enum: ContactInfluence })
  @IsEnum(ContactInfluence)
  @IsOptional()
  influence?: ContactInfluence;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
