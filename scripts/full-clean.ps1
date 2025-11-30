Write-Host "Dropping database and users (root password required)..."
Get-Content .\scripts\mysql-nuke.sql | mysql -u root -p

Write-Host "Removing app-level DB environment files..."
Remove-Item -ErrorAction SilentlyContinue -Force .\apps\frontend-next\.env.local
Remove-Item -ErrorAction SilentlyContinue -Force .\apps\onboarding-next\.env.local
Remove-Item -ErrorAction SilentlyContinue -Force .\apps\students-next\.env.local

Write-Host "Clean completed."

