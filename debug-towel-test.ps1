# Test the exact query to see debug logs
$body = @{
    userId = "debug_test"
    message = "Kam nevojë për peshqir"
} | ConvertTo-Json

Write-Host "Testing: Kam nevojë për peshqir" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Response: $($response.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response.products.Count)" -ForegroundColor Blue
    Write-Host "Product names: $($response.products.name -join ', ')" -ForegroundColor Yellow
    Write-Host "Product colors: $($response.products.color -join ', ')" -ForegroundColor Magenta
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
