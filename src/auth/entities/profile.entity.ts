import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './users.entity';

export enum AvailabilityStatus {
  DoNotDisturb = 'Do Not Disturb',
  Idle = 'Idle',
  Online = 'Online',
  Invisible = 'Invisible',
}

@Entity({ name: 'profile' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: '' })
  profile_picture: string;

  @Column({ default: '' })
  profile_banner: string;

  @Column({ default: '' })
  bio: string;

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.Online,
    name: 'availability_status',
  })
  availabilityStatus: AvailabilityStatus;

  @Column({ type: 'boolean', name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'boolean', name: 'is_blocked' })
  isBlocked: boolean;

  @Column({ type: 'text', default: '' })
  skills: string;

  @Column({ default: '' })
  location: string;

  @Column({ type: 'text', default: '' })
  social_links: string;

  @Column({ type: 'text', default: '' })
  experience: string;

  @Column({ type: 'text', default: '' })
  education: string;

  @Column({ type: 'bigint', nullable: true })
  timezone: number;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
