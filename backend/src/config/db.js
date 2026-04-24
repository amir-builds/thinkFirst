import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test the connection
    const conn = await pool.getConnection();
    console.log("✅ MySQL pool connected successfully");
    conn.release();

    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
