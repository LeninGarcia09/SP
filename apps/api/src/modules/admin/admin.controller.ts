import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GraphService } from './graph.service';
import { AssignRoleDto, SyncUsersDto } from './dto/admin.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';
import { UserEntity } from '../users/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly graphService: GraphService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private assertGraphEnabled() {
    if (!this.graphService.isEnabled) {
      throw new ServiceUnavailableException(
        'Microsoft Graph integration is not configured. Set AZURE_AD_CLIENT_CERTIFICATE_BASE64 + AZURE_AD_CLIENT_CERTIFICATE_THUMBPRINT (or AZURE_AD_CLIENT_SECRET) environment variables.',
      );
    }
  }

  private extractToken(req: { headers: { authorization?: string } }): string {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new BadRequestException('Missing Bearer token');
    }
    return auth.slice(7);
  }

  // ─── Tenant Users ───

  @Get('tenant-users')
  @ApiOperation({ summary: 'List all users in the M365 tenant' })
  async listTenantUsers(@Req() req: { headers: { authorization?: string } }) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);
    const users = await this.graphService.listTenantUsers(token);
    return { data: users };
  }

  // ─── App Roles ───

  @Get('app-roles')
  @ApiOperation({ summary: 'List available app role definitions' })
  async listAppRoles(@Req() req: { headers: { authorization?: string } }) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);
    const roles = await this.graphService.listAppRoles(token);
    return { data: roles };
  }

  // ─── Role Assignments ───

  @Get('role-assignments')
  @ApiOperation({ summary: 'List current app role assignments' })
  async listRoleAssignments(
    @Req() req: { headers: { authorization?: string } },
  ) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);
    const assignments = await this.graphService.listRoleAssignments(token);
    return { data: assignments };
  }

  @Post('role-assignments')
  @ApiOperation({ summary: 'Assign an app role to a tenant user' })
  async assignRole(
    @Req() req: { headers: { authorization?: string } },
    @Body() dto: AssignRoleDto,
  ) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);

    // Resolve appRoleValue → appRoleId
    const roles = await this.graphService.listAppRoles(token);
    const role = roles.find((r) => r.value === dto.appRoleValue);
    if (!role) {
      throw new BadRequestException(
        `Unknown app role value: "${dto.appRoleValue}". Available: ${roles.map((r) => r.value).join(', ')}`,
      );
    }

    const assignment = await this.graphService.assignRole(
      token,
      dto.userId,
      role.id,
    );
    this.logger.log(
      `Role "${dto.appRoleValue}" assigned to user ${dto.userId}`,
    );
    return { data: { ...assignment, appRoleName: dto.appRoleValue } };
  }

  @Delete('role-assignments/:id')
  @ApiOperation({ summary: 'Remove an app role assignment' })
  async removeRoleAssignment(
    @Req() req: { headers: { authorization?: string } },
    @Param('id') assignmentId: string,
  ) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);
    await this.graphService.removeRoleAssignment(token, assignmentId);
    this.logger.log(`Role assignment ${assignmentId} removed`);
    return { data: { removed: true } };
  }

  // ─── User Sync ───

  @Post('sync-users')
  @ApiOperation({
    summary:
      'Sync M365 users into CRM — imports user profile data from Microsoft Graph',
  })
  async syncUsers(
    @Req() req: { headers: { authorization?: string } },
    @Body() dto: SyncUsersDto,
  ) {
    this.assertGraphEnabled();
    const token = this.extractToken(req);

    const synced: string[] = [];
    const errors: { userId: string; error: string }[] = [];

    for (const m365UserId of dto.userIds) {
      try {
        const tenantUser = await this.graphService.getTenantUser(
          token,
          m365UserId,
        );

        const email =
          tenantUser.mail ?? tenantUser.userPrincipalName;

        // Find existing user by Azure AD OID or email
        let user = await this.userRepo.findOne({
          where: { azureAdOid: m365UserId },
        });

        if (!user) {
          user = await this.userRepo.findOne({ where: { email } });
        }

        if (user) {
          // Update existing user with M365 data
          user.displayName = tenantUser.displayName;
          user.email = email;
          user.azureAdOid = m365UserId;
          user.jobTitle = tenantUser.jobTitle;
          user.phone = tenantUser.mobilePhone;
          user.isActive = tenantUser.accountEnabled;
          user.m365SyncedAt = new Date();
          await this.userRepo.save(user);
        } else {
          // Create new CRM user from M365 profile
          user = this.userRepo.create({
            azureAdOid: m365UserId,
            email,
            displayName: tenantUser.displayName,
            role: UserRole.TEAM_MEMBER,
            jobTitle: tenantUser.jobTitle,
            phone: tenantUser.mobilePhone,
            isActive: tenantUser.accountEnabled,
            m365SyncedAt: new Date(),
          });
          await this.userRepo.save(user);
        }

        synced.push(m365UserId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ userId: m365UserId, error: message });
        this.logger.warn(`Failed to sync user ${m365UserId}: ${message}`);
      }
    }

    return {
      data: {
        synced: synced.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  // ─── CRM Users (local DB) ───

  @Get('crm-users')
  @ApiOperation({
    summary: 'List all CRM users with their M365 sync status',
  })
  async listCrmUsers() {
    const users = await this.userRepo.find({
      order: { displayName: 'ASC' },
    });
    return { data: users };
  }
}
