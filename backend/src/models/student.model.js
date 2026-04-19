import crypto from "crypto";

class Student {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const [rows] = await this.db.execute(
      "SELECT * FROM students WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await this.db.execute(
      "SELECT * FROM students WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  async findByProviderUserId(provider, providerUserId) {
    const [rows] = await this.db.execute(
      "SELECT * FROM students WHERE provider = ? AND providerUserId = ?",
      [provider, providerUserId]
    );
    return rows[0] || null;
  }

  async create(studentData) {
    const {
      email,
      name,
      passwordHash = null,
      provider = "local",
      providerUserId = null,
      profilePicture = null,
      emailVerified = false,
    } = studentData;

    const id = crypto.randomUUID();

    await this.db.execute(
      `INSERT INTO students (id, email, name, passwordHash, provider, providerUserId, profilePicture, emailVerified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, name, passwordHash, provider, providerUserId, profilePicture, emailVerified]
    );

    return {
      id,
      email,
      name,
      provider,
      profilePicture,
      emailVerified,
    };
  }

  async updateOAuthProfile(id, oauthData) {
    const {
      name,
      profilePicture,
      emailVerified,
      provider,
      providerUserId,
    } = oauthData;

    await this.db.execute(
      `UPDATE students SET name = ?, profilePicture = ?, emailVerified = ?, provider = ?, providerUserId = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, profilePicture, emailVerified, provider, providerUserId, id]
    );

    return this.findById(id);
  }

  async getStudentStats(studentId) {
    const [rows] = await this.db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'solved' THEN 1 END) as problemsSolved,
        COUNT(CASE WHEN status = 'attempted' THEN 1 END) as problemsAttempted,
        COUNT(*) as totalProblems,
        SUM(thinkingTime) as totalThinkingTime,
        SUM(codingTime) as totalCodingTime
       FROM studentProgress WHERE studentId = ?`,
      [studentId]
    );
    return rows[0];
  }

  async getRecentActivity(studentId, limit = 10) {
    const [rows] = await this.db.execute(
      `SELECT 
        sp.id,
        sp.status,
        sp.thinkingTime,
        sp.codingTime,
        sp.createdAt as attemptedAt,
        sp.updatedAt,
        q.title as questionTitle,
        q.difficulty as questionDifficulty
       FROM studentProgress sp
       LEFT JOIN questions q ON sp.questionId = q.id
       WHERE sp.studentId = ?
       ORDER BY sp.updatedAt DESC
       LIMIT ${parseInt(limit, 10)}`,
      [studentId]
    );
    return rows;
  }

  async getActivityHeatmap(studentId) {
    // Returns daily activity counts for the past year.
    // DATE_FORMAT returns a plain string (e.g. "2026-04-19") so mysql2
    // does NOT convert it to a Date object — avoiding the UTC-offset bug
    // where midnight IST becomes the previous day when using toISOString().
    const [rows] = await this.db.execute(
      `SELECT 
        DATE_FORMAT(createdAt, '%Y-%m-%d') as date,
        COUNT(*) as count
       FROM studentProgress
       WHERE studentId = ?
         AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
       GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
       ORDER BY date ASC`,
      [studentId]
    );
    return rows;
  }
}

export default Student;
