import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('persons')
export class PersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  employeeId: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  jobTitle: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ type: 'varchar', length: 50, default: 'ON_BENCH' })
  assignmentStatus: string; // ON_PROJECT | ON_OPPORTUNITY | ON_OPERATIONS | ON_BENCH

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'text', array: true, default: '{}' })
  skills: string[];

  @Column({ type: 'text', nullable: true })
  availabilityNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
