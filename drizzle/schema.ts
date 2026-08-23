import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing the Manus OAuth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Owner-managed educational medicine entries. Only `approved` entries are searchable publicly.
 * No dosage, patient-specific eligibility, or diagnosis fields are stored here.
 */
export const medicineCatalog = mysqlTable("medicine_catalog", {
  id: int("id").autoincrement().primaryKey(),
  genericName: varchar("genericName", { length: 160 }).notNull(),
  brandNames: text("brandNames").notNull(),
  searchTerms: text("searchTerms").notNull(),
  activeIngredient: text("activeIngredient").notNull(),
  medicineClass: varchar("medicineClass", { length: 160 }).notNull(),
  informationSummary: text("informationSummary").notNull(),
  safetyNote: text("safetyNote").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 80 }).notNull().default("US"),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  reviewerName: varchar("reviewerName", { length: 160 }).notNull(),
  reviewedAt: timestamp("reviewedAt").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "archived"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MedicineCatalogItem = typeof medicineCatalog.$inferSelect;
export type InsertMedicineCatalogItem = typeof medicineCatalog.$inferInsert;
