-- ============================================
-- RAG CHATBOT PLUGIN TABLES
-- ============================================
-- Run this in MySQL client to add RAG chatbot tables
-- These tables are also included in the main schema.sql

USE sas;

-- Table: rag_documents
-- Tracks uploaded PDFs per student
CREATE TABLE IF NOT EXISTS rag_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  upload_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  chunk_count INT DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_status (upload_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: rag_conversations
-- Tracks chat sessions per student
CREATE TABLE IF NOT EXISTS rag_conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: rag_messages
-- Stores chat history
CREATE TABLE IF NOT EXISTS rag_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  sources JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES rag_conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SELECT 'RAG Chatbot tables created successfully!' AS message;

-- Show the tables
SHOW TABLES LIKE 'rag_%';
