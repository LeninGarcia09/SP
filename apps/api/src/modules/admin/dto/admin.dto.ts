import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, IsOptional, ArrayMinSize } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'M365 user Object ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'App role value (e.g. ADMIN, PROJECT_MANAGER)' })
  @IsString()
  appRoleValue: string;
}

export class SyncUsersDto {
  @ApiProperty({ description: 'Array of M365 user Object IDs to sync' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  userIds: string[];

  @ApiPropertyOptional({ description: 'Tenant ID to sync users from (defaults to primary tenant)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
