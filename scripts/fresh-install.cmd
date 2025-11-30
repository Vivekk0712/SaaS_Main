@echo off
setlocal
REM Fresh install: create DB + user, apply schema, seed all data, and set app env.

REM 1) Ensure DB and user (will prompt for root password)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\scripts\mysql-reset.sql | mysql -u root -p" || goto :error

REM 2) Create .env.local for all apps
call :write_env "apps\frontend-next\.env.local"
call :write_env "apps\onboarding-next\.env.local"
call :write_env "apps\students-next\.env.local"

REM 3) Apply schema + seed
call scripts\setup-and-seed.cmd || goto :error

echo Fresh install completed.
exit /b 0

:write_env
set FILE=%~1
echo DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas> %FILE%
exit /b 0

:error
echo Fresh install failed. See errors above.
exit /b 1
