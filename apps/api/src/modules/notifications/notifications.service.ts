import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async countUnread(userId: string) {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async create(dto: CreateNotificationDto) {
    const notification = this.repo.create(dto);
    return this.repo.save(notification);
  }

  async markRead(id: string, isRead: boolean) {
    const notification = await this.repo.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = isRead;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true })
      .where('userId = :userId AND isRead = false', { userId })
      .execute();
  }

  async delete(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Notification not found');
  }
}
