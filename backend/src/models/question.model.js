import crypto from "crypto";

export class Question {
  constructor(db) {
    this.db = db;
  }

  async create(questionData) {
    const id = crypto.randomUUID();
    const {
      title,
      description,
      input_format = null,
      output_format = null,
      constraints = null,
      difficulty = 'Easy',
      category = 'DSA',
      is_public = false,
      sample_input1 = null,
      sample_output1 = null,
      sample_input2 = null,
      sample_output2 = null,
      sample_input3 = null,
      sample_output3 = null,
      sample_input4 = null,
      sample_output4 = null,
      sample_input5 = null,
      sample_output5 = null,
      sample_input6 = null,
      sample_output6 = null,
      sample_input7 = null,
      sample_output7 = null,
      sample_input8 = null,
      sample_output8 = null,
      sample_input9 = null,
      sample_output9 = null,
      sample_input10 = null,
      sample_output10 = null,
      schema_sql = null,
      sample_data = null,
      created_by_admin = 'admin-001'
    } = questionData;

    await this.db.execute(
      `INSERT INTO questions (
        id, title, description, input_format, output_format, constraints,
        difficulty, category, is_public,
        sample_input1, sample_output1,
        sample_input2, sample_output2,
        sample_input3, sample_output3,
        sample_input4, sample_output4,
        sample_input5, sample_output5,
        sample_input6, sample_output6,
        sample_input7, sample_output7,
        sample_input8, sample_output8,
        sample_input9, sample_output9,
        sample_input10, sample_output10,
        schema_sql, sample_data, created_by_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, input_format, output_format, constraints,
        difficulty, category, is_public,
        sample_input1, sample_output1,
        sample_input2, sample_output2,
        sample_input3, sample_output3,
        sample_input4, sample_output4,
        sample_input5, sample_output5,
        sample_input6, sample_output6,
        sample_input7, sample_output7,
        sample_input8, sample_output8,
        sample_input9, sample_output9,
        sample_input10, sample_output10,
        schema_sql, sample_data, created_by_admin
      ]
    );

    return { id, ...questionData };
  }

  async findAll() {
    const [rows] = await this.db.execute("SELECT * FROM questions ORDER BY created_at DESC");
    return rows;
  }

  async findPublic() {
    const [rows] = await this.db.execute("SELECT * FROM questions WHERE is_public = TRUE ORDER BY created_at DESC");
    return rows;
  }

  async findById(id) {
    const [rows] = await this.db.execute("SELECT * FROM questions WHERE id = ?", [id]);
    return rows[0] || null;
  }

  async update(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    await this.db.execute(
      `UPDATE questions SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id) {
    await this.db.execute("DELETE FROM questions WHERE id = ?", [id]);
  }

  async togglePublic(id) {
    await this.db.execute(
      "UPDATE questions SET is_public = NOT is_public WHERE id = ?",
      [id]
    );
    return this.findById(id);
  }
}
