import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { NotificationType } from '@telnub/shared';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
