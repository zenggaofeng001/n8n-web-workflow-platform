# N8N Web Workflow Platform - Quick Start PowerShell Script
# Author: N8N Web Platform Team
# Version: 1.0.0

param(
    [switch]$SkipBrowser,
    [switch]$Verbose
)

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $color = $Colors[$Type]
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Test-DockerRunning {
    try {
        $null = docker info 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "$ServiceName is healthy" "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "$ServiceName is not responding yet" "Warning"
        return $false
    }
}

# Main script
Clear-Host
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  N8N Web Workflow Platform - Quick Start" -ForegroundColor Cyan
Write-Host "  PowerShell Version 1.0.0" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-ColorOutput "Checking Docker status..." "Info"
if (-not (Test-DockerRunning)) {
    Write-ColorOutput "Docker is not running. Please start Docker Desktop first." "Error"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-ColorOutput "Docker is running" "Success"

# Start services
Write-ColorOutput "Starting N8N Web Workflow Platform..." "Info"

$composeFile = $null
$composeCommand = $null

# Try development compose file first
if (Test-Path "docker-compose.dev.yml") {
    Write-ColorOutput "Using development compose file..." "Info"
    $composeFile = "docker-compose.dev.yml"
    $composeCommand = "docker-compose -f docker-compose.dev.yml"
}
elseif (Test-Path "docker\docker-compose.yml") {
    Write-ColorOutput "Using docker directory compose file..." "Info"
    $composeFile = "docker\docker-compose.yml"
    $composeCommand = "docker-compose -f docker\docker-compose.yml"
}
else {
    Write-ColorOutput "No docker-compose.yml file found!" "Error"
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Docker containers
Write-ColorOutput "Starting Docker containers..." "Info"
try {
    if ($Verbose) {
        Invoke-Expression "$composeCommand up -d"
    } else {
        Invoke-Expression "$composeCommand up -d" | Out-Null
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker compose failed with exit code $LASTEXITCODE"
    }
    
    Write-ColorOutput "Services started successfully!" "Success"
}
catch {
    Write-ColorOutput "Failed to start services: $($_.Exception.Message)" "Error"
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for services to start
Write-ColorOutput "Waiting for services to start..." "Info"
Start-Sleep -Seconds 20

# Show service status
Write-ColorOutput "Checking service status..." "Info"
try {
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor Yellow
    Invoke-Expression "$composeCommand ps"
    Write-Host ""
}
catch {
    Write-ColorOutput "Could not get service status" "Warning"
}

# Health checks
Write-ColorOutput "Performing health checks..." "Info"
$services = @(
    @{ Name = "N8N Instance"; Url = "http://localhost:5679/healthz" },
    @{ Name = "Grafana"; Url = "http://localhost:3001/api/health" }
)

foreach ($service in $services) {
    Test-ServiceHealth -Url $service.Url -ServiceName $service.Name
}

# Display access information
Write-Host ""
Write-ColorOutput "N8N Web Workflow Platform is now running!" "Success"
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  Access Information" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Yellow
Write-Host "   N8N Instance:     http://localhost:5679" -ForegroundColor White
Write-Host "   Grafana Monitor:  http://localhost:3001" -ForegroundColor White
Write-Host "   Prometheus:       http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor Yellow
Write-Host "   N8N:              admin / admin123" -ForegroundColor White
Write-Host "   Grafana:          admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Management Commands:" -ForegroundColor Yellow
Write-Host "   View logs:        $composeCommand logs -f" -ForegroundColor White
Write-Host "   Stop services:    $composeCommand down" -ForegroundColor White
Write-Host "   Restart:          $composeCommand restart" -ForegroundColor White
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green

# Ask to open browser
if (-not $SkipBrowser) {
    Write-Host ""
    $openBrowser = Read-Host "Open browser to access N8N? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Write-ColorOutput "Opening browser..." "Info"
        Start-Process "http://localhost:5679"
        Start-Process "http://localhost:3001"
    }
}

Write-Host ""
Write-ColorOutput "Quick start completed successfully!" "Success"
Write-Host ""
Read-Host "Press Enter to exit"
