import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const travelStyleEnum = pgEnum("travel_style", [
  "budget",
  "standard",
  "comfort",
  "luxury",
]);

export const budgetTypeEnum = pgEnum("budget_type", ["fixed", "unlimited"]);

export const planStatusEnum = pgEnum("plan_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  planCounter: integer("plan_counter").notNull().default(0),
  planMonth: text("plan_month"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  partySize: integer("party_size").notNull().default(1),
  travelStyle: travelStyleEnum("travel_style").notNull(),
  budgetType: budgetTypeEnum("budget_type").notNull(),
  budgetAmount: numeric("budget_amount"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const preferenceSnapshots = pgTable("preference_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  interests: jsonb("interests").$type<string[]>().notNull(),
  pace: text("pace").notNull().default("balanced"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  status: planStatusEnum("status").notNull().default("queued"),
  stage: text("stage"),
  input: jsonb("input").$type<unknown>(),
  totalCost: numeric("total_cost"),
  itinerary: jsonb("itinerary").$type<unknown>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const planDays = pgTable("plan_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  date: date("date"),
  activities: jsonb("activities").$type<unknown[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const costItems = pgTable("cost_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  isBuffer: boolean("is_buffer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PlanDay = typeof planDays.$inferSelect;
export type CostItem = typeof costItems.$inferSelect;
export type PreferenceSnapshot = typeof preferenceSnapshots.$inferSelect;

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  preferenceSnapshot: one(preferenceSnapshots, {
    fields: [trips.id],
    references: [preferenceSnapshots.tripId],
  }),
  plans: many(plans),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  trip: one(trips, {
    fields: [plans.tripId],
    references: [trips.id],
  }),
  days: many(planDays),
  costItems: many(costItems),
}));

export const planDaysRelations = relations(planDays, ({ one }) => ({
  plan: one(plans, {
    fields: [planDays.planId],
    references: [plans.id],
  }),
}));

export const costItemsRelations = relations(costItems, ({ one }) => ({
  plan: one(plans, {
    fields: [costItems.planId],
    references: [plans.id],
  }),
}));

export const preferenceSnapshotsRelations = relations(
  preferenceSnapshots,
  ({ one }) => ({
    trip: one(trips, {
      fields: [preferenceSnapshots.tripId],
      references: [trips.id],
    }),
  })
);