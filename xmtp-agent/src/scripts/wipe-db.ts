#!/usr/bin/env node

/**
 * Local Database Cleaner
 *
 * This script cleans the local XMTP database files to start fresh.
 * Use this when you want to reset your local database state.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the database directory path
 * This mirrors the logic from helpers/client.ts
 */
function getDbDirectory() {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || "../.data/xmtp";

  // Resolve relative to project root
  const projectRoot = path.resolve(__dirname, "..");
  return path.resolve(projectRoot, volumePath);
}

/**
 * Clean the local database
 */
async function cleanLocalDatabase() {
  try {
    console.log("🧹 Starting local database cleanup...");

    const dbDirectory = getDbDirectory();
    console.log(`📁 Database directory: ${dbDirectory}`);

    // Check if database directory exists
    if (!fs.existsSync(dbDirectory)) {
      console.log("✅ Database directory doesn't exist - nothing to clean");
      return;
    }

    // List all files in the database directory
    const files = fs.readdirSync(dbDirectory);
    const dbFiles = files.filter(
      (file) =>
        file.endsWith(".db3") ||
        file.endsWith(".db3.sqlcipher_salt") ||
        file.endsWith(".db3-shm") ||
        file.endsWith(".db3-wal"),
    );

    if (dbFiles.length === 0) {
      console.log("✅ No database files found - nothing to clean");
      return;
    }

    console.log(`📋 Found ${dbFiles.length} database files to clean:`);
    dbFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    console.log("\n🗑️  Removing database files...");

    // Remove each database file
    for (const file of dbFiles) {
      const filePath = path.join(dbDirectory, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`  ✓ Removed: ${file}`);
      } catch (error) {
        console.error(
          `  ❌ Failed to remove ${file}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log("\n✅ Database cleanup completed!");
    console.log(
      "\nNote: The agent will create a new database when it starts next time.",
    );
  } catch (error) {
    console.error(
      "❌ Database cleanup failed:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("\nTroubleshooting:");
    console.error("1. Make sure no XMTP processes are running");
    console.error("2. Check file permissions in the database directory");
    console.error("3. Try running the script again");
    process.exit(1);
  }
}

// Run the cleanup
cleanLocalDatabase().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
