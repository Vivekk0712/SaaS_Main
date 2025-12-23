# Database Setup Guide

## Problem
Getting error: `Access denied for user 'sas_app'@'localhost'`

This means the MySQL user doesn't exist or has wrong credentials.

## Solution Options

### Option 1: Create the Required MySQL User (Recommended)

1. **Open MySQL as root:**
   ```powershell
   mysql -u root -p
   ```

2. **Run these commands:**
   ```sql
   -- Create database
   CREATE DATABASE IF NOT EXISTS sas;
   
   -- Create user
   CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY 'sas_strong_password_123';
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
   
   -- Apply changes
   FLUSH PRIVILEGES;
   
   -- Verify user was created
   SELECT User, Host FROM mysql.user WHERE User = 'sas_app';
   
   -- Exit
   EXIT;
   ```

3. **Test the connection:**
   ```powershell
   mysql -u sas_app -p sas
   # Enter password: sas_strong_password_123
   ```

4. **Run the seed scripts:**
   ```powershell
   npm run db:seed
   ```

---

### Option 2: Use Root User (Quick Fix)

1. **Create `.env` file in project root:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_root_password
   DB_NAME=sas
   ```

2. **Run the seed scripts:**
   ```powershell
   npm run db:seed
   ```

---

### Option 3: Use Different MySQL User

If you have another MySQL user with permissions:

1. **Create `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=sas
   ```

2. **Grant permissions to that user:**
   ```sql
   mysql -u root -p
   GRANT ALL PRIVILEGES ON sas.* TO 'your_username'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Run the seed scripts:**
   ```powershell
   npm run db:seed
   ```

---

## Complete Setup Steps

### Step 1: Install MySQL
If MySQL is not installed:
- Download from: https://dev.mysql.com/downloads/installer/
- Install MySQL Server
- Remember the root password you set during installation

### Step 2: Create Database and User
```powershell
# Login to MySQL
mysql -u root -p

# Run these commands
CREATE DATABASE IF NOT EXISTS sas;
CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY 'sas_strong_password_123';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Apply Schema
```powershell
# From project root
mysql -u sas_app -p sas < sql/schema.sql
# Password: sas_strong_password_123
```

### Step 4: Seed Data
```powershell
npm run db:seed
```

### Step 5: Verify
```powershell
# Check if data was inserted
mysql -u sas_app -p sas -e "SELECT COUNT(*) FROM classes;"
mysql -u sas_app -p sas -e "SELECT COUNT(*) FROM students;"
```

---

## Troubleshooting

### Error: "mysql: command not found"
**Solution:** Add MySQL to PATH or use full path:
```powershell
# Windows
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

### Error: "Access denied for user 'root'"
**Solution:** Reset root password:
1. Stop MySQL service
2. Start MySQL with `--skip-grant-tables`
3. Reset password
4. Restart MySQL normally

### Error: "Database 'sas' doesn't exist"
**Solution:**
```sql
mysql -u root -p
CREATE DATABASE sas;
EXIT;
```

### Error: "Can't connect to MySQL server"
**Solution:**
1. Check if MySQL service is running
2. Check port 3306 is not blocked
3. Verify MySQL is installed

---

## Environment Variables Reference

Create `.env` file in project root with these variables:

```env
# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=sas_strong_password_123
DB_NAME=sas

# Or use root (not recommended for production)
# DB_USER=root
# DB_PASSWORD=your_root_password
```

---

## Quick Commands Reference

```powershell
# Create user and database
mysql -u root -p < setup-db.sql

# Apply schema
mysql -u sas_app -p sas < sql/schema.sql

# Seed data
npm run db:seed

# Check connection
node apps/frontend-next/scripts/db-health.mjs

# Validate database
node apps/frontend-next/scripts/validate-db.mjs
```

---

## Security Notes

### For Development:
- Using `sas_app` user is fine
- Password `sas_strong_password_123` is acceptable

### For Production:
- Change the password to something stronger
- Use environment variables (never commit passwords)
- Consider using MySQL user with limited permissions
- Enable SSL for database connections

---

## Need Help?

If still having issues:

1. **Check MySQL is running:**
   ```powershell
   # Windows
   Get-Service MySQL*
   
   # Or check in Services app (services.msc)
   ```

2. **Check MySQL version:**
   ```powershell
   mysql --version
   ```

3. **Test connection:**
   ```powershell
   mysql -u root -p -e "SELECT 1;"
   ```

4. **Check error logs:**
   - Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
   - Look for recent errors

---

## Summary

✅ **Create MySQL user:** `sas_app` with password `sas_strong_password_123`
✅ **Grant permissions:** `GRANT ALL PRIVILEGES ON sas.*`
✅ **Create database:** `CREATE DATABASE sas`
✅ **Apply schema:** `mysql -u sas_app -p sas < sql/schema.sql`
✅ **Seed data:** `npm run db:seed`

Done! Your database is ready! 🎉
