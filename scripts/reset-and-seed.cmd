@echo off
setlocal
REM Drop + recreate DB and user, then apply schema and seed

REM Run the MySQL reset SQL as root (will prompt for password)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\scripts\mysql-reset.sql | mysql -u root -p" || goto :error

call scripts\setup-and-seed.cmd || goto :error

echo Reset + seed completed.
exit /b 0

:error
echo Reset failed. See errors above.
exit /b 1

