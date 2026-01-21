-- ================================
-- QUESTIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS questions (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    category ENUM('DSA', 'SQL') NOT NULL DEFAULT 'DSA',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- For DSA questions
    sample_input1 TEXT,
    sample_output1 TEXT,
    sample_input2 TEXT,
    sample_output2 TEXT,
    sample_input3 TEXT,
    sample_output3 TEXT,
    
    -- For SQL questions
    schema_sql TEXT,
    sample_data TEXT,
    
    created_by_admin CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_admin) REFERENCES admins(id) ON DELETE CASCADE
);

-- Sample DSA Question
INSERT INTO questions (id, title, description, input_format, output_format, constraints, difficulty, category, is_public, sample_input1, sample_output1, sample_input2, sample_output2, created_by_admin) VALUES
('q-001', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'Array of integers and target', 'Array of two indices', 'Array length: 2-1000', 'Easy', 'DSA', TRUE, '[2,7,11,15], 9', '[0,1]', '[3,2,4], 6', '[1,2]', 'admin-001');
