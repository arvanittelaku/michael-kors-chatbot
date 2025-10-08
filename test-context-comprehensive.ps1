# Comprehensive test to verify context preservation fix
$body1 = @{
    userId = "test_context_fix"
    message = "Kërkoj kemishe"
} | ConvertTo-Json

$body2 = @{
    userId = "test_context_fix" 
    message = "ngjyre te kuqe"
} | ConvertTo-Json

$body3 = @{
    userId = "test_context_fix"
    message = "fustan i kuq nen 20$"
} | ConvertTo-Json

Write-Host "🧪 COMPREHENSIVE CONTEXT PRESERVATION TEST" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ Testing: Kërkoj kemishe (establish shirt context)" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ Response: $($response1.message.Substring(0, 80))..." -ForegroundColor Green
    Write-Host "📦 Products: $($response1.products.Count) shirts" -ForegroundColor Blue
    Write-Host "🎨 Colors: $($response1.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "2️⃣ Testing: ngjyre te kuqe (should maintain shirt context)" -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ Response: $($response2.message.Substring(0, 80))..." -ForegroundColor Green
    Write-Host "📦 Products: $($response2.products.Count) products" -ForegroundColor Blue
    Write-Host "🎨 Colors: $($response2.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host "📝 Names: $($response2.products.name -join ', ')" -ForegroundColor White
    
    # Check if context was maintained
    $shirtProducts = $response2.products | Where-Object { 
        $_.name -and ($_.name.ToLower().Contains("kemishe") -or $_.name.ToLower().Contains("maicë") -or $_.name.ToLower().Contains("shirt"))
    }
    
    if ($response2.products.Count -eq 0) {
        Write-Host "🎉 SUCCESS: No products returned - correct for no red shirts!" -ForegroundColor Green
    } elseif ($shirtProducts.Count -eq $response2.products.Count) {
        Write-Host "🎉 SUCCESS: Context maintained - only shirts returned" -ForegroundColor Green
    } else {
        Write-Host "❌ ISSUE: Context lost - mixed categories returned" -ForegroundColor Red
        Write-Host "   Expected: Only shirts, Got: Mixed categories" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "3️⃣ Testing: fustan i kuq nen 20$ (should switch to dress context)" -ForegroundColor Yellow
    $response3 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "✅ Response: $($response3.message.Substring(0, 80))..." -ForegroundColor Green
    Write-Host "📦 Products: $($response3.products.Count) products" -ForegroundColor Blue
    Write-Host "🎨 Colors: $($response3.products.color -join ', ')" -ForegroundColor Magenta
    Write-Host "📝 Names: $($response3.products.name -join ', ')" -ForegroundColor White
    
    # Check if context switched correctly
    $dressProducts = $response3.products | Where-Object { 
        $_.name -and ($_.name.ToLower().Contains("fustan") -or $_.name.ToLower().Contains("dress"))
    }
    $nonDressProducts = $response3.products | Where-Object { 
        $_.name -and !($_.name.ToLower().Contains("fustan") -or $_.name.ToLower().Contains("dress"))
    }
    
    if ($nonDressProducts.Count -eq 0) {
        Write-Host "🎉 SUCCESS: Context switched correctly - only dresses returned" -ForegroundColor Green
    } else {
        Write-Host "❌ ISSUE: Context contamination - non-dress products included" -ForegroundColor Red
        Write-Host "   Non-dress products: $($nonDressProducts.name -join ', ')" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
    Write-Host "   Query 1 (shirts): $($response1.products.Count) products ✅" -ForegroundColor Green
    Write-Host "   Query 2 (red shirts): $($response2.products.Count) products" -ForegroundColor $(if($response2.products.Count -eq 0) {"Green"} else {"Red"})
    Write-Host "   Query 3 (red dresses): $($response3.products.Count) products" -ForegroundColor $(if($nonDressProducts.Count -eq 0) {"Green"} else {"Red"})
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
