# PowerShell script to automatically upload local .env variables to GitHub Secrets

# 1. Check if gh CLI is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] GitHub CLI (gh) is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install it by running: winget install --id GitHub.cli" -ForegroundColor Yellow
    Write-Host "Or download it from: https://cli.github.com/" -ForegroundColor Yellow
    Exit 1
}

# 2. Check if user is authenticated with gh
gh auth status >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] You are not logged in to GitHub CLI." -ForegroundColor Red
    Write-Host "Please run 'gh auth login' to authenticate, then run this script again." -ForegroundColor Yellow
    Exit 1
}

# 3. Detect GitHub Repository Owner/Name from Git remote
$remoteUrl = git remote get-url origin
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($remoteUrl)) {
    Write-Host "[ERROR] Could not detect git remote origin." -ForegroundColor Red
    Exit 1
}

# Parse owner and repo from URL (works for HTTPS and SSH)
if ($remoteUrl -match 'github\.com[:/]([^/]+)/([^.]+)(?:\.git)?') {
    $owner = $Matches[1]
    $repo = $Matches[2]
    $repoIdentifier = "$owner/$repo"
    Write-Host "Target GitHub Repository: $repoIdentifier" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Could not parse owner/repo from remote URL: $remoteUrl" -ForegroundColor Red
    Exit 1
}

# 4. Read and parse .env file
$envPath = Join-Path (Get-Location) ".env"
if (!(Test-Path $envPath)) {
    Write-Host "[ERROR] .env file not found in current directory: $envPath" -ForegroundColor Red
    Exit 1
}

Write-Host "Reading environment variables from $envPath..." -ForegroundColor Cyan
$secretsCount = 0

# Read lines, filter comments/empty lines, parse KEY=VALUE
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and !$line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        
        # Remove surrounding quotes if present
        if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
            $value = $Matches[1]
        }
        
        if ($key -and $value) {
            Write-Host "Setting GitHub Secret: $key..." -ForegroundColor Yellow
            $value | gh secret set $key --repo $repoIdentifier
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Successfully set $key" -ForegroundColor Green
                $secretsCount++
            } else {
                Write-Host "Failed to set $key" -ForegroundColor Red
            }
        }
    }
}

# 5. Ask to set FLY_API_TOKEN
$flyToken = $env:FLY_API_TOKEN
if ([string]::IsNullOrEmpty($flyToken)) {
    Write-Host ""
    $flyToken = Read-Host "Do you want to set FLY_API_TOKEN in GitHub Secrets? (Press Enter to skip, or paste your Fly Deploy Token)"
} else {
    Write-Host ""
    Write-Host "Using FLY_API_TOKEN from environment variable..." -ForegroundColor Cyan
}

if ($flyToken) {
    Write-Host "Setting GitHub Secret: FLY_API_TOKEN..." -ForegroundColor Yellow
    $flyToken.Trim() | gh secret set FLY_API_TOKEN --repo $repoIdentifier
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully set FLY_API_TOKEN" -ForegroundColor Green
        $secretsCount++
    } else {
        Write-Host "Failed to set FLY_API_TOKEN" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Set a total of $secretsCount secrets in GitHub repository $repoIdentifier." -ForegroundColor Green
