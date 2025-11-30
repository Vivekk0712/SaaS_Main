Write-Host "[1/3] Creating database and user (root password required)..."
Get-Content .\scripts\mysql-reset.sql | mysql -u root -p

Write-Host "[2/3] Writing .env.local files..."
$envLine = 'DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas'
Set-Content -NoNewline -Path .\apps\frontend-next\.env.local -Value $envLine
Set-Content -NoNewline -Path .\apps\onboarding-next\.env.local -Value $envLine
Set-Content -NoNewline -Path .\apps\students-next\.env.local -Value $envLine

Write-Host "[3/3] Applying schema and seeding data..."
cmd /c scripts\setup-and-seed.cmd

Write-Host "Fresh install completed."
