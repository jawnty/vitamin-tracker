import { type Vitamin, type InsertVitamin, type VitaminIntake, type InsertVitaminIntake } from "@shared/schema";

export interface IStorage {
  getVitamins(userId: string): Promise<Vitamin[]>;
  createVitamin(vitamin: InsertVitamin): Promise<Vitamin>;
  updateVitamin(id: number, vitamin: Partial<InsertVitamin>): Promise<Vitamin>;
  deleteVitamin(id: number): Promise<void>;
  getVitaminIntake(userId: string, date: Date): Promise<VitaminIntake[]>;
  upsertVitaminIntake(intake: InsertVitaminIntake): Promise<VitaminIntake>;
}

export class MemStorage implements IStorage {
  private vitamins: Map<number, Vitamin>;
  private vitaminIntake: Map<number, VitaminIntake>;
  private currentVitaminId: number = 1;
  private currentIntakeId: number = 1;

  constructor() {
    this.vitamins = new Map();
    this.vitaminIntake = new Map();
  }

  async getVitamins(userId: string): Promise<Vitamin[]> {
    return Array.from(this.vitamins.values()).filter(v => v.userId === userId);
  }

  async createVitamin(vitamin: InsertVitamin): Promise<Vitamin> {
    const id = this.currentVitaminId++;
    const newVitamin = { ...vitamin, id };
    this.vitamins.set(id, newVitamin);
    return newVitamin;
  }

  async updateVitamin(id: number, vitamin: Partial<InsertVitamin>): Promise<Vitamin> {
    const existing = this.vitamins.get(id);
    if (!existing) throw new Error("Vitamin not found");
    const updated = { ...existing, ...vitamin };
    this.vitamins.set(id, updated);
    return updated;
  }

  async deleteVitamin(id: number): Promise<void> {
    this.vitamins.delete(id);
  }

  async getVitaminIntake(userId: string, date: Date): Promise<VitaminIntake[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.vitaminIntake.values()).filter(
      vi => vi.userId === userId && vi.date === dateString
    );
  }

  async upsertVitaminIntake(intake: InsertVitaminIntake): Promise<VitaminIntake> {
    const dateString = new Date(intake.date).toISOString().split('T')[0];
    const existing = Array.from(this.vitaminIntake.values()).find(
      vi => 
        vi.vitaminId === intake.vitaminId && 
        vi.userId === intake.userId && 
        vi.date === dateString
    );

    if (existing) {
      const updated = { ...existing, taken: intake.taken ?? false };
      this.vitaminIntake.set(existing.id, updated);
      return updated;
    }

    const id = this.currentIntakeId++;
    const newIntake = { ...intake, id, date: dateString, taken: intake.taken ?? false };
    this.vitaminIntake.set(id, newIntake);
    return newIntake;
  }
}

export const storage = new MemStorage();