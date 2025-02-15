import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { User } from './users.entity';

@Entity({ name: 'users_roles' })
export class UsersRole {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'role_id' })
  roleId: string;

  @Column({ type: 'timestamp', nullable: true, name: 'joinedAt' })
  joinedAt: Date;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.usersRoles)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
