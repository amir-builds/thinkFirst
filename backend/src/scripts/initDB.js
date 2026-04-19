/**
 * initDB.js — Run once to ensure all required tables and columns exist.
 * Usage: node src/scripts/initDB.js
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log("✅ Connected to database:", process.env.MYSQL_DATABASE);

  try {
    // ─────────────────────────────────────────────────────────
    // 1. Ensure `bio` column exists in `students`
    // ─────────────────────────────────────────────────────────
    const [bioCheck] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students' AND COLUMN_NAME = 'bio'
    `, [process.env.MYSQL_DATABASE]);

    if (bioCheck.length === 0) {
      await connection.execute(`ALTER TABLE students ADD COLUMN bio TEXT DEFAULT NULL`);
      console.log("✅ Added `bio` column to `students` table");
    } else {
      console.log("ℹ️  `bio` column already exists in `students`");
    }

    // ─────────────────────────────────────────────────────────
    // 2. Create `studentProgress` table
    // ─────────────────────────────────────────────────────────
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS studentProgress (
        id          VARCHAR(36)                      NOT NULL,
        studentId   VARCHAR(36)                      NOT NULL,
        questionId  VARCHAR(36)                      NOT NULL,
        status      ENUM('attempted', 'solved')       NOT NULL DEFAULT 'attempted',
        thinkingTime INT                             DEFAULT 0,
        codingTime   INT                             DEFAULT 0,
        attemptedAt  DATETIME                        DEFAULT CURRENT_TIMESTAMP,
        solvedAt     DATETIME                        DEFAULT NULL,
        updatedAt    DATETIME                        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_sp_studentId  (studentId),
        INDEX idx_sp_solvedAt   (solvedAt),
        INDEX idx_sp_attemptedAt (attemptedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ `studentProgress` table is ready");

    // ─────────────────────────────────────────────────────────
    // 3. Create `studentStreak` table  (for future use)
    // ─────────────────────────────────────────────────────────
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS studentStreak (
        studentId     VARCHAR(36) NOT NULL PRIMARY KEY,
        currentStreak INT         NOT NULL DEFAULT 0,
        longestStreak INT         NOT NULL DEFAULT 0,
        lastActiveDate DATE       DEFAULT NULL,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ `studentStreak` table is ready");

    console.log("\n🎉 Database initialization complete!");
  } finally {
    await connection.end();
  }
}

initDB().catch((err) => {
  console.error("❌ initDB failed:", err);
  process.exit(1);
});
