import {
  Entity,
  Column,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { UsersRole } from './users_roles.entity';
import { UsersTeam } from '../../teams/entities/users_team.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity({ name: 'users_table' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ default: '' })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ type: 'timestamp', nullable: true, name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Column()
  company: string;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @Column({ type: 'boolean' })
  isAvailable: boolean;

  // Relación one-to-one con Profile (lado inverso, la FK está en profile)
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // Relación one-to-many con la entidad de unión UsersRole
  @OneToMany(() => UsersRole, (usersRole) => usersRole.user)
  userRoles: UsersRole[];

  // Relación one-to-many con la entidad de unión UsersTeam
  @OneToMany(() => UsersTeam, (usersTeam) => usersTeam.user)
  userTeams: UsersTeam[];

  // Si el usuario es líder de equipos, esta relación lo refleja
  @OneToMany(() => Team, (team) => team.leader)
  teamsLed: Team[];
}
