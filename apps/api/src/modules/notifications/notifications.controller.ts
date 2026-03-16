import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, MarkReadDto } from './dto/notification.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@bizops/shared';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findMine(@Req() req: any) {
    const userId = req.user?.sub;
    const notifications = await this.service.findByUser(userId);
    return { data: notifications };
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const userId = req.user?.sub;
    const count = await this.service.countUnread(userId);
    return { data: { count } };
  }

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async create(@Body() dto: CreateNotificationDto) {
    const notification = await this.service.create(dto);
    return { data: notification };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Body() dto: MarkReadDto) {
    const notification = await this.service.markRead(id, dto.isRead);
    return { data: notification };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@Req() req: any) {
    const userId = req.user?.sub;
    await this.service.markAllRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
