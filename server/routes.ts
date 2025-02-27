import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVitaminSchema, insertVitaminIntakeSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/vitamins", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const vitamins = await storage.getVitamins(userId);
    res.json(vitamins);
  });

  app.post("/api/vitamins", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parsed = insertVitaminSchema.safeParse({ ...req.body, userId });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid vitamin data" });
    }

    const vitamin = await storage.createVitamin(parsed.data);
    res.json(vitamin);
  });

  app.patch("/api/vitamins/:id", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = parseInt(req.params.id);
    const parsed = insertVitaminSchema.partial().safeParse({ ...req.body, userId });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid vitamin data" });
    }

    try {
      const vitamin = await storage.updateVitamin(id, parsed.data);
      res.json(vitamin);
    } catch (err) {
      res.status(404).json({ message: "Vitamin not found" });
    }
  });

  app.delete("/api/vitamins/:id", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = parseInt(req.params.id);
    await storage.deleteVitamin(id);
    res.status(204).send();
  });

  app.get("/api/vitamin-intake", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const date = new Date(req.query.date as string);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const intake = await storage.getVitaminIntake(userId, date);
    res.json(intake);
  });

  app.post("/api/vitamin-intake", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parsed = insertVitaminIntakeSchema.safeParse({ ...req.body, userId });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid intake data" });
    }

    const intake = await storage.upsertVitaminIntake(parsed.data);
    res.json(intake);
  });

  return createServer(app);
}
