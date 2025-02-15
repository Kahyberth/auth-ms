import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { UsersRole } from './users_roles.entity';

export enum RoleEnum {
  User = 'user',
  Admin = 'admin',
}

@Entity({ name: 'role' })
export class Role {
  @PrimaryColumn()
  id: string;

  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.User,
  })
  role: RoleEnum;

  @Column({ type: 'timestamp', nullable: true, name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date;

  // Relación one-to-many con la entidad de unión UsersRole
  @OneToMany(() => UsersRole, (usersRole) => usersRole.role)
  usersRoles: UsersRole[];
}
