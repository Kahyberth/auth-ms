import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users_table', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  rol: text('rol').$type<'user' | 'admin'>().default('user'),
  isActive: integer('is_active').notNull().default(0),
});
