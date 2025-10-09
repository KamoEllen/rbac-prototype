Write-Host "Testing API" -ForegroundColor Green

Write-Host "`n1. Health Check" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost:3000/health"
$health | ConvertTo-Json

Write-Host "`n2. Login (Passwordless Link)" -ForegroundColor Cyan
$loginBody = @{
    email = "admin@acme.com"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.token
Write-Host "Passwordless Link Token: $token" -ForegroundColor Yellow

Write-Host "`n3. Verify token and get session" -ForegroundColor Cyan
$verifyBody = @{
    token = $token
} | ConvertTo-Json

$verifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/verify" `
    -Method Post `
    -ContentType "application/json" `
    -Body $verifyBody

$sessionToken = $verifyResponse.sessionToken
$teamId = $verifyResponse.user.teamId

Write-Host "Session Token: $sessionToken" -ForegroundColor Yellow
Write-Host "Team ID: $teamId" -ForegroundColor Yellow
$verifyResponse.user | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $sessionToken"
    "Content-Type" = "application/json"
}

Write-Host "`n4. Get current user" -ForegroundColor Cyan
$me = Invoke-RestMethod -Uri "http://localhost:3000/auth/me" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$me | ConvertTo-Json -Depth 5

Write-Host "`n5. List all users" -ForegroundColor Cyan
$users = Invoke-RestMethod -Uri "http://localhost:3000/users" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
Write-Host "Found $($users.Count) users" -ForegroundColor Green
$users | Select-Object email, name, verified | Format-Table

Write-Host "`n6. List teams" -ForegroundColor Cyan
$teams = Invoke-RestMethod -Uri "http://localhost:3000/teams" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$teams | Select-Object name, userCount | Format-Table

Write-Host "`n7. List roles" -ForegroundColor Cyan
$roles = Invoke-RestMethod -Uri "http://localhost:3000/roles" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$roles | Select-Object name, groupCount | Format-Table

Write-Host "`n8. List groups" -ForegroundColor Cyan
$groups = Invoke-RestMethod -Uri "http://localhost:3000/groups" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$groups | Select-Object name, roleCount, memberCount | Format-Table

Write-Host "`n9. Create vault secret" -ForegroundColor Cyan
$secretBody = @{
    name = "API Key"
    value = "sk_test_123"
    teamId = $teamId
} | ConvertTo-Json

$secret = Invoke-RestMethod -Uri "http://localhost:3000/vault" `
    -Method Post `
    -Headers $headers `
    -Body $secretBody
Write-Host "Created secret: $($secret.name)" -ForegroundColor Green

Write-Host "`n10. List vault secrets" -ForegroundColor Cyan
$secrets = Invoke-RestMethod -Uri "http://localhost:3000/vault?teamId=$teamId" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$secrets | Select-Object name, value | Format-Table

Write-Host "`n11. Create financial transaction" -ForegroundColor Cyan
$txnBody = @{
    amount = "1500.00"
    description = "Q1 Revenue"
    teamId = $teamId
} | ConvertTo-Json

$transaction = Invoke-RestMethod -Uri "http://localhost:3000/financials" `
    -Method Post `
    -Headers $headers `
    -Body $txnBody
Write-Host "Created transaction: $($transaction.description)" -ForegroundColor Green

Write-Host "`n12. List financial transactions" -ForegroundColor Cyan
$transactions = Invoke-RestMethod -Uri "http://localhost:3000/financials?teamId=$teamId" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$transactions | Select-Object amount, description | Format-Table

Write-Host "`n13. Create report" -ForegroundColor Cyan
$reportBody = @{
    title = "Q1 Report 2025"
    content = "Quarterly performance summary for Q1 2025"
    teamId = $teamId
} | ConvertTo-Json

$report = Invoke-RestMethod -Uri "http://localhost:3000/reporting" `
    -Method Post `
    -Headers $headers `
    -Body $reportBody
Write-Host "Created report: $($report.title)" -ForegroundColor Green

Write-Host "`n14. List reports" -ForegroundColor Cyan
$reports = Invoke-RestMethod -Uri "http://localhost:3000/reporting?teamId=$teamId" `
    -Headers @{"Authorization" = "Bearer $sessionToken"}
$reports | Select-Object title | Format-Table

Write-Host "`n===== All Tests Passed! =====" -ForegroundColor Green
Write-Host "`nSession Token for curl: $sessionToken" -ForegroundColor Yellow
Write-Host "Team ID: $teamId" -ForegroundColor Yellow