# Simple PowerShell test for color filtering
$body1 = @{
    userId = "test456"
    message = "Kërkoj kemishe"
} | ConvertTo-Json

$body2 = @{
    userId = "test456" 
    message = "ngjyre te kuqe"
} | ConvertTo-Json

Write-Host "Testing Color Filtering Fix..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing: Kërkoj kemishe" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "Response: $($response1.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response1.products.Count)" -ForegroundColor Blue
    Write-Host "Colors: $($response1.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "2. Testing: ngjyre te kuqe" -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "Response: $($response2.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response2.products.Count)" -ForegroundColor Blue
    Write-Host "Colors: $($response2.products.color -join ', ')" -ForegroundColor Magenta
    
    # Check if filtering worked
    $hasRedProducts = $false
    foreach ($product in $response2.products) {
        if ($product.color -and $product.color.ToLower().Contains("red")) {
            $hasRedProducts = $true
            break
        }
    }
    
    if ($hasRedProducts) {
        Write-Host "SUCCESS: Red products found!" -ForegroundColor Green
    } else {
        Write-Host "ISSUE: No red products found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
