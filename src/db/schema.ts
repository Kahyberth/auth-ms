import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users_table', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  lastName: text().notNull(),
  phone: text().notNull().default(''),
  email: text().notNull().unique(),
  password: text().notNull(),
  language: text().notNull().default('en'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  last_login: integer('last_login', { mode: 'timestamp' }),
  company: text().notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull(),
});

export const profile = sqliteTable('profile', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => usersTable.id)
    .notNull(),
  profile_picture: text('profile_picture').notNull().default(''),
  profile_banner: text('profile_banner').notNull().default(''),
  bio: text().notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  availabilityStatus: text('availability_status', {
    enum: ['Do Not Disturb', 'Idle', 'Online', 'Invisible'],
  })
    .notNull()
    .default('Online'),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull(),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).notNull(),
  skills: text({ mode: 'json' }).notNull().default(''),
  location: text().notNull().default(''),
  social_links: text({ mode: 'json' }).notNull().default(''),
  experience: text('experience', { mode: 'json' }).notNull().default(''),
  education: text('education', { mode: 'json' }).notNull().default(''),
  timezone: integer({ mode: 'timestamp_ms' }),
});

export const role = sqliteTable('role', {
  id: text('id').primaryKey(),
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const team = sqliteTable('team', {
  id: text('id').primaryKey().notNull(),
  name: text().notNull(),
  description: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
  leader_id: text('leader_id')
    .references(() => usersTable.id)
    .notNull(),
});

// Relation between users and profile

export const userRelationWithProfile = relations(usersTable, ({ one }) => ({
  profile: one(profile),
}));

export const profileRelationWithUser = relations(profile, ({ one }) => ({
  user: one(usersTable, {
    fields: [profile.userId],
    references: [usersTable.id],
  }),
}));

// Relation between users and role

export const users_roles = sqliteTable('users_roles', {
  user_id: text('user_id').references(() => usersTable.id),
  role_id: text('role_id').references(() => role.id),
  joinedAt: integer('joined_at', { mode: 'timestamp' }),
});

export const user_roles_relations = relations(users_roles, ({ one }) => ({
  user: one(usersTable, {
    fields: [users_roles.user_id],
    references: [usersTable.id],
  }),
  role: one(role, {
    fields: [users_roles.role_id],
    references: [role.id],
  }),
}));

export const userRelationWithRole = relations(usersTable, ({ many }) => ({
  users_roles: many(users_roles),
}));

export const roleRelationWithUser = relations(role, ({ many }) => ({
  users_roles: many(users_roles),
}));

// Relation between users and team

export const users_teams = sqliteTable('users_teams', {
  user_id: text('user_id').references(() => usersTable.id),
  team_id: text('team_id').references(() => team.id),
  roleInTeam: text('role_in_team', {
    enum: [
      'Scrum Master',
      'Product Owner',
      'Developer',
      'QA Tester',
      'UX/UI Designer',
      'Tech Lead',
      'Business Analyst',
      'Stakeholder',
      'Support Engineer',
    ],
  }),
});

export const user_teams_relations = relations(users_teams, ({ one }) => ({
  user: one(usersTable, {
    fields: [users_teams.user_id],
    references: [usersTable.id],
  }),
  team: one(team, {
    fields: [users_teams.team_id],
    references: [team.id],
  }),
}));

export const userRelationWithTeam = relations(usersTable, ({ many }) => ({
  users_teams: many(users_teams),
}));

export const teamRelationWithUser = relations(team, ({ many }) => ({
  users_teams: many(users_teams),
}));
