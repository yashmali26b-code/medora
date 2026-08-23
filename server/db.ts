import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertMedicineCatalogItem,
  InsertUser,
  medicineCatalog,
  users,
} from "../drizzle/schema";
import { selectPublicCatalogueMatches } from "./medicineCatalogue";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCatalogueForAdmin() {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(medicineCatalog).orderBy(desc(medicineCatalog.updatedAt));
}

export async function searchApprovedCatalogue(query: string) {
  const db = await getDb();
  if (!db) return null;
  const approvedItems = await db
    .select()
    .from(medicineCatalog)
    .where(eq(medicineCatalog.status, "approved"))
    .orderBy(desc(medicineCatalog.updatedAt));

  return selectPublicCatalogueMatches(approvedItems, query).slice(0, 8);
}

export async function createCatalogueItem(item: InsertMedicineCatalogItem) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(medicineCatalog).values(item);
  return true;
}

export async function updateCatalogueStatus(id: number, status: "draft" | "approved" | "archived") {
  const db = await getDb();
  if (!db) return null;
  await db.update(medicineCatalog).set({ status }).where(eq(medicineCatalog.id, id));
  return true;
}
