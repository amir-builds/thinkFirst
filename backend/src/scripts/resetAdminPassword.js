import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../config/db.js";

dotenv.config();

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      args[key] = rest.length ? rest.join("=") : true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || args.e;
  const password = args.password || args.p;
  const createIfMissing = Boolean(args.create || args.c);

  if (!email || !password) {
    console.error("Usage: node src/scripts/resetAdminPassword.js --email=<email> --password=<newPassword> [--create]");
    process.exit(1);
  }

  const db = await connectDB();
  try {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [rows] = await db.execute("SELECT id, email FROM admins WHERE email = ?", [email]);

    if (rows.length === 0) {
      if (!createIfMissing) {
        console.error(`No admin found for email ${email}. Re-run with --create to create one.`);
        process.exit(2);
      }
      const resolvedId = crypto.randomUUID();
      await db.execute(
        "INSERT INTO admins (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
        [resolvedId, "Admin User", email, passwordHash, "superadmin"]
      );
      console.log(`Created new admin ${email} with role superadmin.`);
    } else {
      await db.execute("UPDATE admins SET passwordHash = ? WHERE email = ?", [passwordHash, email]);
      console.log(`Updated password for admin ${email}.`);
    }
  } catch (err) {
    console.error("Failed to reset admin password:", err.message || err);
    process.exitCode = 3;
  } finally {
    try { await db.end(); } catch {}
  }
}

main();
