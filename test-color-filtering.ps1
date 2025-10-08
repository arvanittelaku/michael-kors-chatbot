# Simple PowerShell test for color filtering
$body1 = @{
    userId = "test456"
    message = "Kërkoj kemishe"
} | ConvertTo-Json

$body2 = @{
    userId = "test456" 
    message = "ngjyre te kuqe"
} | ConvertTo-Json

Write-Host "🧪 Testing Color Filtering Fix..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ Testing: 'Kërkoj kemishe'" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ Response: $($response1.message.Substring(0, [Math]::Min(100, $response1.message.Length)))..." -ForegroundColor Green
    Write-Host "📦 Products returned: $($response1.products.Count)" -ForegroundColor Blue
    Write-Host "🎨 Colors: $($response1.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "2️⃣ Testing: 'ngjyre te kuqe' (should only return red shirts)" -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ Response: $($response2.message.Substring(0, [Math]::Min(100, $response2.message.Length)))..." -ForegroundColor Green
    Write-Host "📦 Products returned: $($response2.products.Count)" -ForegroundColor Blue
    Write-Host "🎨 Colors: $($response2.products.color -join ', ')" -ForegroundColor Magenta
    
    # Check if filtering worked
    $hasRedProducts = $response2.products | Where-Object { $_.color -and $_.color.ToLower().Contains("red") }
    if ($hasRedProducts) {
        Write-Host "✅ SUCCESS: Red products found!" -ForegroundColor Green
    } else {
        Write-Host "❌ ISSUE: No red products found - filtering may be too strict" -ForegroundColor Red
    }
    
    # Check if context was maintained (only shirts)
    $allShirts = $response2.products | Where-Object { 
        $_.name -and ($_.name.ToLower().Contains("kemishe") -or $_.name.ToLower().Contains("maicë") -or $_.name.ToLower().Contains("shirt"))
    }
    if ($allShirts.Count -eq $response2.products.Count) {
        Write-Host "✅ SUCCESS: Context maintained - only shirts returned" -ForegroundColor Green
    } else {
        Write-Host "❌ ISSUE: Context lost - mixed categories returned" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
