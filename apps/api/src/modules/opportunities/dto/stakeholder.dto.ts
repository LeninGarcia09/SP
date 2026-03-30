import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import {
  StakeholderRole,
  StakeholderInfluence,
  StakeholderSentiment,
} from '@telnub/shared';

export class CreateStakeholderDto {
  @ApiProperty()
  @IsUUID()
  contactId!: string;

  @ApiPropertyOptional({ enum: StakeholderRole, default: StakeholderRole.INFLUENCER })
  @IsEnum(StakeholderRole)
  @IsOptional()
  role?: StakeholderRole;

  @ApiPropertyOptional({ enum: StakeholderInfluence, default: StakeholderInfluence.MEDIUM })
  @IsEnum(StakeholderInfluence)
  @IsOptional()
  influence?: StakeholderInfluence;

  @ApiPropertyOptional({ enum: StakeholderSentiment, default: StakeholderSentiment.UNKNOWN })
  @IsEnum(StakeholderSentiment)
  @IsOptional()
  sentiment?: StakeholderSentiment;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStakeholderDto {
  @ApiPropertyOptional({ enum: StakeholderRole })
  @IsEnum(StakeholderRole)
  @IsOptional()
  role?: StakeholderRole;

  @ApiPropertyOptional({ enum: StakeholderInfluence })
  @IsEnum(StakeholderInfluence)
  @IsOptional()
  influence?: StakeholderInfluence;

  @ApiPropertyOptional({ enum: StakeholderSentiment })
  @IsEnum(StakeholderSentiment)
  @IsOptional()
  sentiment?: StakeholderSentiment;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
