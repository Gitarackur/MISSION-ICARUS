// src/database/index.ts
import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import { setupMigrations } from "./migrations";
import { IcarusDBAdapter } from "./adapter";
import fs from "fs";

export const initializeDatabase = async () => {
  try {
    const userData = app.getPath("userData");
    const dbPath = path.join(userData, "icarus.db");
    
    // Create directory if it doesn't exist
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    const migrationRunner = setupMigrations(db);
    await migrationRunner.runMigrations();

    const icarusDBAdapter = new IcarusDBAdapter(db);

    console.log("Database initialized at:", dbPath);

    return { db, icarusDBAdapter, migrationRunner };
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error; 
  }
};

export const getDB = () => {
  const userData = app.getPath("userData");
  const dbPath = path.join(userData, "icarus.db");
  return new Database(dbPath);
}