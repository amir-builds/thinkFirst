-- Initialize Database Schema
SOURCE /docker-entrypoint-initdb.d/00-admins.sql;
SOURCE /docker-entrypoint-initdb.d/10-questions.sql;
SOURCE /docker-entrypoint-initdb.d/20-students.sql;
