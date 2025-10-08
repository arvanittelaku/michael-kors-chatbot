# Test to find red products in dataset
$body = @{
    userId = "test789"
    message = "red"
} | ConvertTo-Json

Write-Host "Testing for red products in dataset..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Response: $($response.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response.products.Count)" -ForegroundColor Blue
    Write-Host "Colors: $($response.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host "Names: $($response.products.name -join ', ')" -ForegroundColor Yellow
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
