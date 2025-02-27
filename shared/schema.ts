import { pgTable, text, serial, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vitamins = pgTable("vitamins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  userId: text("user_id").notNull(),
});

export const vitaminIntake = pgTable("vitamin_intake", {
  id: serial("id").primaryKey(),
  vitaminId: integer("vitamin_id").notNull(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  taken: boolean("taken").notNull().default(false),
});

export const insertVitaminSchema = createInsertSchema(vitamins).pick({
  name: true,
  dosage: true,
  userId: true,
});

export const insertVitaminIntakeSchema = createInsertSchema(vitaminIntake).pick({
  vitaminId: true,
  userId: true,
  date: true,
  taken: true,
});

export type InsertVitamin = z.infer<typeof insertVitaminSchema>;
export type Vitamin = typeof vitamins.$inferSelect;
export type InsertVitaminIntake = z.infer<typeof insertVitaminIntakeSchema>;
export type VitaminIntake = typeof vitaminIntake.$inferSelect;
