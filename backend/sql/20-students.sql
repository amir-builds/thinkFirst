-- ==============================
-- STUDENTS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS students (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  passwordHash VARCHAR(255),
  profilePicture VARCHAR(500),
  bio TEXT,
  provider ENUM('local', 'github', 'google') DEFAULT 'local',
  providerUserId VARCHAR(500),
  isActive BOOLEAN DEFAULT TRUE,
  emailVerified BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================
-- STUDENT PROGRESS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS studentProgress (
  id CHAR(36) PRIMARY KEY,
  studentId CHAR(36) NOT NULL,
  questionId CHAR(36) NOT NULL,
  status ENUM('attempted', 'solved', 'skipped') DEFAULT 'attempted',
  thinkingApproach TEXT,
  codeSubmitted TEXT,
  executionResult JSON,
  thinkingTime INT,
  codingTime INT,
  aiMentorFeedback TEXT,
  approachQuality ENUM('excellent', 'good', 'okay', 'needs_work') DEFAULT 'needs_work',
  totalAttempts INT DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY (studentId, questionId)
);

-- ==============================
-- STUDENT BOOKMARKS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS studentBookmarks (
  id CHAR(36) PRIMARY KEY,
  studentId CHAR(36) NOT NULL,
  questionId CHAR(36) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY (studentId, questionId)
);

-- ==============================
-- STUDENT ACHIEVEMENTS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS studentAchievements (
  id CHAR(36) PRIMARY KEY,
  studentId CHAR(36) NOT NULL,
  badgeType VARCHAR(100),
  description TEXT,
  earnedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);
