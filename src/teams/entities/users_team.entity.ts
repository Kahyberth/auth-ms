import { User } from 'src/auth/entities/users.entity';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from './team.entity';

export enum TeamRoleEnum {
  ScrumMaster = 'Scrum Master',
  ProductOwner = 'Product Owner',
  Developer = 'Developer',
  QATester = 'QA Tester',
  UXUIDesigner = 'UX/UI Designer',
  TechLead = 'Tech Lead',
  BusinessAnalyst = 'Business Analyst',
  Stakeholder = 'Stakeholder',
  SupportEngineer = 'Support Engineer',
}

@Entity({ name: 'users_teams' })
export class UsersTeam {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'team_id' })
  teamId: string;

  @Column({
    type: 'enum',
    enum: TeamRoleEnum,
    nullable: false,
    name: 'role_in_team',
  })
  roleInTeam: TeamRoleEnum;

  @ManyToOne(() => User, (user) => user.userTeams)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Team, (team) => team.usersTeams)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
