# Test script for uploading a PDF
# Usage: .\test-upload.ps1 path\to\file.pdf

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$API_URL = "http://localhost:4000/api"
$TOKEN = "test-token"

if (-not (Test-Path $FilePath)) {
    Write-Host "File not found: $FilePath" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading: $FilePath" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

$form = @{
    file = Get-Item -Path $FilePath
}

try {
    $response = Invoke-RestMethod -Uri "$API_URL/upload" -Method Post -Headers $headers -Form $form
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "Upload ID: $($response.uploadId)"
    Write-Host "Status: $($response.status)"
    
    # Check status
    Write-Host "`nChecking processing status..." -ForegroundColor Cyan
    $uploadId = $response.uploadId
    
    do {
        Start-Sleep -Seconds 2
        $status = Invoke-RestMethod -Uri "$API_URL/upload/$uploadId/status" -Headers $headers
        Write-Host "Status: $($status.status) - Chunks: $($status.chunks_count)"
    } while ($status.status -eq "pending" -or $status.status -eq "processing")
    
    if ($status.status -eq "done") {
        Write-Host "`nProcessing complete! Ready to query." -ForegroundColor Green
    } else {
        Write-Host "`nProcessing failed: $($status.error_message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
