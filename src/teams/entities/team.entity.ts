import { User } from '../../auth/entities/users.entity';
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersTeam } from './users_team.entity';


export enum TeamStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
}

@Entity({ name: 'team' })
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;


  @Column({ nullable: true })
  image: string;


  // Usamos CURRENT_TIMESTAMP como valor por defecto; ajusta según tu motor de BD
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({ name: 'leader_id' })
  leaderId: string;

  @Column({
    type: 'enum',
    enum: TeamStatus,
    default: TeamStatus.PENDING,
  })
  status: TeamStatus;

  @ManyToOne(() => User, (user) => user.teamsLed)
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => UsersTeam, (usersTeam) => usersTeam.team)
  usersTeams: UsersTeam[];
}
