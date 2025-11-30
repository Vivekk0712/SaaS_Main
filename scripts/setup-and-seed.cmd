@echo off
setlocal
REM Configure DB URL for Node-based seeders
set DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas

echo Applying schema from docs...
node apps\frontend-next\scripts\apply-schema-from-doc.mjs || goto :error

echo Seeding master tables...
node apps\frontend-next\scripts\seed-master.mjs || goto :error

echo Seeding dummy students/parents/teachers...
node apps\frontend-next\scripts\seed-dummy.mjs || goto :error

echo Seeding academics data...
node apps\frontend-next\scripts\seed-academics.mjs || goto :error

echo Seeding parent auth (password 12345)...
node apps\onboarding-next\scripts\seed-parent-auth.mjs || goto :error

echo Validating tables...
node apps\frontend-next\scripts\validate-db.mjs || goto :warn

echo Done.
exit /b 0

:warn
echo Validation reported warnings. Review above output.
exit /b 0

:error
echo Setup aborted due to error. See messages above.
exit /b 1
