import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { TeamMemberRole } from '@telnub/shared';

export class CreateTeamMemberDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: TeamMemberRole, default: TeamMemberRole.OWNER })
  @IsEnum(TeamMemberRole)
  @IsOptional()
  role?: TeamMemberRole;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: TeamMemberRole })
  @IsEnum(TeamMemberRole)
  @IsOptional()
  role?: TeamMemberRole;
}
