$ProgressPreference = 'SilentlyContinue'

# Get token
$loginBody = @{email='test@example.com';password='Test123!@#'} | ConvertTo-Json
Write-Host "Logging in..."
$loginResp = Invoke-WebRequest -Uri 'http://localhost:4000/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody -UseBasicParsing
$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.accessToken
Write-Host "Token received: $($token.Substring(0, 20))..."

# Create event  
$eventBody = @{
    name="Tech Conference 2026"
    description="Annual technology conference"
    venue="Convention Center"
    startDate="2026-08-15T09:00:00Z"
    endDate="2026-08-15T17:00:00Z"
} | ConvertTo-Json

$headers = @{
    'Authorization' = "Bearer $token"
}

Write-Host "Creating event..."
$eventResp = Invoke-WebRequest -Uri 'http://localhost:4000/events/cmryrf2i70002w2m4qqwh2w41' -Method POST -ContentType 'application/json' -Headers $headers -Body $eventBody -UseBasicParsing
Write-Host "Response:"
$eventResp.Content | ConvertFrom-Json | ConvertTo-Json
