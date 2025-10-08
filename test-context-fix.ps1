# Test the context preservation fix
$body1 = @{
    userId = "test999"
    message = "Kërkoj kemishe"
} | ConvertTo-Json

$body2 = @{
    userId = "test999" 
    message = "ngjyre te kuqe"
} | ConvertTo-Json

Write-Host "Testing Context Preservation Fix..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing: Kërkoj kemishe" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "Response: $($response1.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response1.products.Count)" -ForegroundColor Blue
    Write-Host "Categories: $($response1.products.name -join ', ')" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "2. Testing: ngjyre te kuqe (should maintain shirt context)" -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "Response: $($response2.message.Substring(0, 100))..." -ForegroundColor Green
    Write-Host "Products returned: $($response2.products.Count)" -ForegroundColor Blue
    Write-Host "Categories: $($response2.products.name -join ', ')" -ForegroundColor Magenta
    
    # Check if context was maintained (only shirts)
    $allShirts = $false
    if ($response2.products.Count -eq 0) {
        Write-Host "SUCCESS: No products returned - correct for no red shirts!" -ForegroundColor Green
        $allShirts = $true
    } else {
        $shirtProducts = $response2.products | Where-Object { 
            $_.name -and ($_.name.ToLower().Contains("kemishe") -or $_.name.ToLower().Contains("maicë") -or $_.name.ToLower().Contains("shirt"))
        }
        if ($shirtProducts.Count -eq $response2.products.Count) {
            Write-Host "SUCCESS: Context maintained - only shirts returned" -ForegroundColor Green
            $allShirts = $true
        } else {
            Write-Host "ISSUE: Context lost - mixed categories returned" -ForegroundColor Red
        }
    }
    
    if ($allShirts) {
        Write-Host "🎉 CONTEXT PRESERVATION FIX WORKING!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
