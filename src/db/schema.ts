import { relations } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  numeric,
  smallint,
  bigserial,
  jsonb,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core"

// ────────────────────────────────────────────────────────────
// Better-Auth-Tabellen (Feldnamen folgen der Better-Auth-Konvention,
// siehe https://www.better-auth.com/docs/concepts/database#core-schema)
// ────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ────────────────────────────────────────────────────────────
// App-Tabellen (bisher als Supabase-Postgres-Tabellen gepflegt,
// jetzt hier als Source of Truth für Drizzle-Migrationen)
// ────────────────────────────────────────────────────────────

export const transactionTypeValues = ["income", "expense"] as const
export const savingsDirectionValues = ["deposit", "withdrawal"] as const
export const activityActionValues = ["created", "updated", "deleted"] as const

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: transactionTypeValues }).notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categories_user_name_type_idx").on(t.userId, t.name, t.type)]
)

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  type: text("type", { enum: transactionTypeValues }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  description: text("description").notNull().default(""),
  date: date("date").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringSourceId: uuid("recurring_source_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Merkt sich, für welchen Monat eine wiederkehrende Vorlage bewusst
// übersprungen wurde (z. B. weil die Buchung für diesen Monat gelöscht
// wurde) – verhindert, dass processRecurringTransactions sie neu erzeugt.
export const recurringExclusions = pgTable(
  "recurring_exclusions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("recurring_exclusions_template_month_idx").on(
      t.templateId,
      t.month
    ),
  ]
)

export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  currentAge: smallint("current_age").notNull(),
  targetAge: smallint("target_age").notNull(),
  targetAmount: numeric("target_amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  initialAmount: numeric("initial_amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  etfEnabled: boolean("etf_enabled").notNull().default(false),
  etfAnnualReturn: numeric("etf_annual_return", {
    precision: 5,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(7),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const savingsAccounts = pgTable("savings_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const savingsEntries = pgTable("savings_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").references(() => savingsAccounts.id, {
    onDelete: "cascade",
  }),
  direction: text("direction", { enum: savingsDirectionValues }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  description: text("description").notNull().default(""),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const activityLog = pgTable("activity_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: text("action", { enum: activityActionValues }).notNull(),
  entity: text("entity").notNull(),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ────────────────────────────────────────────────────────────
// Relations (ermöglichen db.query.x.findMany({ with: {...} }),
// analog zu den bisherigen verschachtelten Supabase-Selects)
// ────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}))

export const savingsAccountsRelations = relations(savingsAccounts, ({ many }) => ({
  entries: many(savingsEntries),
}))

export const savingsEntriesRelations = relations(savingsEntries, ({ one }) => ({
  account: one(savingsAccounts, {
    fields: [savingsEntries.accountId],
    references: [savingsAccounts.id],
  }),
}))
