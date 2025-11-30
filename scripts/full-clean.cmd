@echo off
setlocal
REM Hard reset: drop DB/users and remove local DB env files

echo Dropping database and users (you will be prompted for root password)...
mysql -u root -p < scripts\mysql-nuke.sql || goto :error

echo Removing app-level DB environment files...
if exist apps\frontend-next\.env.local del /q apps\frontend-next\.env.local
if exist apps\onboarding-next\.env.local del /q apps\onboarding-next\.env.local
if exist apps\students-next\.env.local del /q apps\students-next\.env.local

echo Clean completed.
exit /b 0

:error
echo Clean failed. See errors above.
exit /b 1

