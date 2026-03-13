import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ProficiencyLevel } from '@bizops/shared';

export class AssignSkillDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skillId: string;

  @ApiPropertyOptional({ enum: ProficiencyLevel, default: ProficiencyLevel.BEGINNER })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  proficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ minimum: 0, maximum: 99 })
  @IsNumber()
  @Min(0)
  @Max(99)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}

export class UpdatePersonSkillDto {
  @ApiPropertyOptional({ enum: ProficiencyLevel })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  proficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ minimum: 0, maximum: 99 })
  @IsNumber()
  @Min(0)
  @Max(99)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}
