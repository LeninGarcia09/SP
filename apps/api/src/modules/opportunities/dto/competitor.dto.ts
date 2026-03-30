import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ThreatLevel, CompetitorStatus } from '@telnub/shared';

export class CreateCompetitorDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  competitorName!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  competitorAccountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  strengths?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  weaknesses?: string;

  @ApiPropertyOptional({ enum: ThreatLevel, default: ThreatLevel.MEDIUM })
  @IsEnum(ThreatLevel)
  @IsOptional()
  threatLevel?: ThreatLevel;

  @ApiPropertyOptional({ enum: CompetitorStatus, default: CompetitorStatus.ACTIVE })
  @IsEnum(CompetitorStatus)
  @IsOptional()
  status?: CompetitorStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCompetitorDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  competitorName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  competitorAccountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  strengths?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  weaknesses?: string;

  @ApiPropertyOptional({ enum: ThreatLevel })
  @IsEnum(ThreatLevel)
  @IsOptional()
  threatLevel?: ThreatLevel;

  @ApiPropertyOptional({ enum: CompetitorStatus })
  @IsEnum(CompetitorStatus)
  @IsOptional()
  status?: CompetitorStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
