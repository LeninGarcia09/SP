import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RagStatus } from '@bizops/shared';

export class RagOverrideDto {
  @ApiProperty({ enum: [RagStatus.GREEN, RagStatus.AMBER, RagStatus.RED] })
  @IsEnum([RagStatus.GREEN, RagStatus.AMBER, RagStatus.RED])
  overallRag: string;

  @ApiProperty({ minLength: 20, maxLength: 1000 })
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  overrideReason: string;
}
