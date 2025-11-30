# 🗄️ Database Architecture

## Overview

The School SAS system uses a **unified database approach** where all services share the same MySQL database for easier management and production deployment.

---

## 📊 Database Structure

### Single MySQL Database: `sas`

**Location**: `localhost:3306`  
**User**: `sas_app`  
**Password**: `9482824040`

All services connect to this single database:

```
┌─────────────────────────────────────────┐
│         MySQL Database: sas             │
│         (localhost:3306)                │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Core ERP Tables               │   │
│  │   - students                    │   │
│  │   - teachers                    │   │
│  │   - classes                     │   │
│  │   - attendance                  │   │
│  │   - marks                       │   │
│  │   - etc.                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Razorpay Tables               │   │
│  │   - payment_attempts            │   │
│  │   - razorpay_payments           │   │
│  │   - refunds                     │   │
│  │   - webhook_events              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   RAG Chatbot Tables            │   │
│  │   - rag_documents               │   │
│  │   - rag_conversations           │   │
│  │   - rag_messages                │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔌 Service Connections

### Main App (Port 3000)
- **Database**: `sas` @ localhost:3306
- **Tables**: All core ERP tables

### Razorpay Plugin (Port 5002)
- **Database**: `sas` @ localhost:3306
- **Tables**: `payment_attempts`, `razorpay_payments`, `refunds`, `webhook_events`

### RAG Chatbot Plugin (Port 4000)
- **Database**: `sas` @ localhost:3306
- **Tables**: `rag_documents`, `rag_conversations`, `rag_messages`
- **Vector DB**: Qdrant @ localhost:6333 (separate, for embeddings)

---

## 🎯 Why Unified Database?

### ✅ Advantages:

1. **Easier Management**
   - Single database to backup
   - Single database to maintain
   - Simpler connection management

2. **Better for Production**
   - One database server to deploy
   - Easier scaling
   - Simpler monitoring

3. **Data Consistency**
   - Foreign keys work across services
   - Transactions can span tables
   - Easier to maintain referential integrity

4. **Cost Effective**
   - One database instance
   - Lower hosting costs
   - Simpler infrastructure

5. **Development Simplicity**
   - One database to seed
   - One schema file
   - Easier testing

### ⚠️ Considerations:

1. **Service Coupling**
   - Services share database schema
   - Schema changes affect multiple services
   - **Mitigation**: Use clear table prefixes (`rag_*`, `razorpay_*`)

2. **Scalability**
   - All services hit same database
   - **Mitigation**: Use connection pooling, read replicas if needed

---

## 🗂️ Table Prefixes

To keep things organized, we use prefixes:

| Prefix | Service | Example Tables |
|--------|---------|----------------|
| (none) | Core ERP | `students`, `teachers`, `classes` |
| `razorpay_` | Razorpay Plugin | `razorpay_payments` |
| `rag_` | RAG Chatbot | `rag_documents`, `rag_conversations` |

---

## 🔄 External Services

Some services use external databases/storage:

### Qdrant (Vector Database)
- **Purpose**: Store embeddings for RAG chatbot
- **Location**: Docker container @ localhost:6333
- **Why Separate**: Specialized vector database, not relational
- **Data**: Document embeddings, not metadata

### Redis (Optional)
- **Purpose**: Caching for RAG chatbot
- **Location**: Docker container @ localhost:6379
- **Why Separate**: In-memory cache, temporary data

---

## 📝 Schema Files

### Main Schema
- **File**: `schema.sql`
- **Contains**: All core ERP tables + Razorpay tables + RAG tables
- **Usage**: Run once to create all tables

### Individual Schemas (for reference)
- `razorpay-tables.sql` - Razorpay tables only
- `rag-chatbot-tables.sql` - RAG chatbot tables only

---

## 🚀 Production Deployment

### Recommended Setup:

```
┌─────────────────────────────────────────┐
│         Production MySQL                │
│         (RDS/Cloud SQL/etc.)            │
│                                         │
│  Database: sas                          │
│  All tables included                    │
└─────────────────────────────────────────┘
         ↑           ↑           ↑
         │           │           │
    ┌────┴────┐ ┌───┴────┐ ┌───┴────┐
    │ Main App│ │Razorpay│ │  RAG   │
    │         │ │ Plugin │ │ Plugin │
    └─────────┘ └────────┘ └────────┘

┌─────────────────────────────────────────┐
│         Qdrant (Vector DB)              │
│         (Separate instance)             │
└─────────────────────────────────────────┘
         ↑
         │
    ┌───┴────┐
    │  RAG   │
    │ Plugin │
    └────────┘
```

### Connection Strings:

All services use the same MySQL connection:
```env
DB_HOST=your-production-mysql-host
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=your-secure-password
DB_NAME=sas
```

---

## 🔐 Security

### Database User Permissions:

```sql
-- Create user with appropriate permissions
CREATE USER 'sas_app'@'%' IDENTIFIED BY 'secure-password';

-- Grant permissions on sas database
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';

-- For production, use more restrictive permissions:
GRANT SELECT, INSERT, UPDATE, DELETE ON sas.* TO 'sas_app'@'%';
```

---

## 📊 Backup Strategy

Since everything is in one database:

```bash
# Backup entire database
mysqldump -u sas_app -p sas > backup_$(date +%Y%m%d).sql

# Restore
mysql -u sas_app -p sas < backup_20251130.sql
```

---

## ✅ Summary

**Current Architecture**: ✅ **Unified Database**

- **One MySQL database** (`sas`) for all services
- **Separate Qdrant** for vector embeddings (specialized use case)
- **Optional Redis** for caching

This is the **recommended approach** for:
- ✅ Easier development
- ✅ Simpler production deployment
- ✅ Better maintainability
- ✅ Lower costs

---

**Last Updated**: November 30, 2025  
**Status**: ✅ Optimized for Production
