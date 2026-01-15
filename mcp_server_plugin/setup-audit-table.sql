-- Create MCP audit logs table in existing database
USE sas;

CREATE TABLE IF NOT EXISTS mcp_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    roles JSON NOT NULL,
    question TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    parameters JSON,
    sql_template TEXT,
    rows_returned INT DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    response_time_ms INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_intent (intent),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Audit table created successfully!' AS status;
