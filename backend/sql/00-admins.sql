-- ==============================
-- ADMINS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS admins (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin') NOT NULL DEFAULT 'admin',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin (password: amir_builds) - skip if exists
INSERT IGNORE INTO admins (id, name, email, passwordHash, role) VALUES 
('admin-001', 'Admin User', 'devamir121@gmail.com', '$2b$12$aF1rIiVGTdJHIZKozyF1Y.oye3IQWvusQrPQlgMfGL9Uc4W11JuC6', 'superadmin');
