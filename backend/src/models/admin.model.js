import crypto from "crypto";

class Admin {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const [rows] = await this.db.execute(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await this.db.execute(
      "SELECT * FROM admins WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  async create(adminData) {
    const { name, email, passwordHash, role = "admin" } = adminData;
    const id = crypto.randomUUID();

    await this.db.execute(
      "INSERT INTO admins (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
      [id, name, email, passwordHash, role]
    );

    return { id, name, email, role };
  }
}

export default Admin;
