import { db } from "./db";
import { vitamins, vitaminIntake, type Vitamin, type InsertVitamin, type VitaminIntake, type InsertVitaminIntake } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getVitamins(userId: string): Promise<Vitamin[]>;
  createVitamin(vitamin: InsertVitamin): Promise<Vitamin>;
  updateVitamin(id: number, vitamin: Partial<InsertVitamin>): Promise<Vitamin>;
  deleteVitamin(id: number): Promise<void>;
  getVitaminIntake(userId: string, date: Date): Promise<VitaminIntake[]>;
  upsertVitaminIntake(intake: InsertVitaminIntake): Promise<VitaminIntake>;
}

export class DatabaseStorage implements IStorage {
  async getVitamins(userId: string): Promise<Vitamin[]> {
    return db.select().from(vitamins).where(eq(vitamins.userId, userId));
  }

  async createVitamin(vitamin: InsertVitamin): Promise<Vitamin> {
    const [created] = await db.insert(vitamins).values(vitamin).returning();
    return created;
  }

  async updateVitamin(id: number, vitamin: Partial<InsertVitamin>): Promise<Vitamin> {
    const [updated] = await db
      .update(vitamins)
      .set(vitamin)
      .where(eq(vitamins.id, id))
      .returning();

    if (!updated) throw new Error("Vitamin not found");
    return updated;
  }

  async deleteVitamin(id: number): Promise<void> {
    await db.delete(vitamins).where(eq(vitamins.id, id));
  }

  async getVitaminIntake(userId: string, date: Date): Promise<VitaminIntake[]> {
    const dateString = new Date(date).toISOString().split('T')[0];
    return db
      .select()
      .from(vitaminIntake)
      .where(
        and(
          eq(vitaminIntake.userId, userId),
          eq(vitaminIntake.date, dateString)
        )
      );
  }

  async upsertVitaminIntake(intake: InsertVitaminIntake): Promise<VitaminIntake> {
    const dateString = new Date(intake.date).toISOString().split('T')[0];
    const existingIntake = await db
      .select()
      .from(vitaminIntake)
      .where(
        and(
          eq(vitaminIntake.vitaminId, intake.vitaminId),
          eq(vitaminIntake.userId, intake.userId),
          eq(vitaminIntake.date, dateString)
        )
      );

    if (existingIntake.length > 0) {
      const [updated] = await db
        .update(vitaminIntake)
        .set({ taken: intake.taken })
        .where(eq(vitaminIntake.id, existingIntake[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(vitaminIntake)
      .values({ ...intake, date: dateString })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();