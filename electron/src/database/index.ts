// src/database/index.ts
import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import { setupMigrations } from "./migrations";
import { MigrationRunner } from "./migrations/migration-runner";
import { IcarusDBAdapter } from "./adapter";

export const initializeDatabase = async () => {
  let db: Database.Database;
  let migrationRunner: MigrationRunner;
  let icarusDBAdapter: IcarusDBAdapter;
  const userData = app.getPath("userData");
  const dbPath = path.join(userData, "icarus.db");
  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    migrationRunner = setupMigrations(db);
    await migrationRunner.runMigrations();

    icarusDBAdapter = new IcarusDBAdapter(db);

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