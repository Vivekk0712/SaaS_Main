# Test script for querying the chatbot
# Usage: .\test-query.ps1 "What is the main topic?"

param(
    [Parameter(Mandatory=$true)]
    [string]$Question
)

$API_URL = "http://localhost:4000/api"
$TOKEN = "test-token"

Write-Host "Question: $Question" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    question = $Question
    filters = @{}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/query" -Method Post -Headers $headers -Body $body
    
    Write-Host "`nAnswer:" -ForegroundColor Green
    Write-Host $response.answer
    
    if ($response.citations -and $response.citations.Count -gt 0) {
        Write-Host "`nSources:" -ForegroundColor Yellow
        foreach ($citation in $response.citations) {
            Write-Host "  - $($citation.fileName) (Page $($citation.page)) - Score: $([math]::Round($citation.score, 2))"
            Write-Host "    $($citation.excerpt)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
