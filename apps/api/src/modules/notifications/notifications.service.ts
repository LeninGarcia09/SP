import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';
import { getCurrentTenantId, getTenantFilter } from '../../common/tenant/tenant.context';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId, ...getTenantFilter() },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    return this.repo.count({ where: { userId, isRead: false, ...getTenantFilter() } });
  }

  async create(dto: CreateNotificationDto) {
    const notification = this.repo.create({ ...dto, tenantId: getCurrentTenantId() });
    return this.repo.save(notification);
  }

  async markRead(id: string, isRead: boolean) {
    const notification = await this.repo.findOneBy({ id, ...getTenantFilter() });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = isRead;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string) {
    const tenantId = getCurrentTenantId();
    const qb = this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true })
      .where('"userId" = :userId AND "isRead" = false', { userId });
    if (tenantId) {
      qb.andWhere('"tenantId" = :tenantId', { tenantId });
    }
    await qb.execute();
  }

  async delete(id: string) {
    const notification = await this.repo.findOneBy({ id, ...getTenantFilter() });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.repo.remove(notification);
  }
}
