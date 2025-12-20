# NomadWay VPS Upload Script (PowerShell)
# Run this from your local machine to upload files to the VPS
# Usage: .\upload-to-vps.ps1

$VPS_IP = "91.228.154.82"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/nomadway"

Write-Host "🚀 NomadWay VPS Upload Script" -ForegroundColor Cyan
Write-Host "   Target: $VPS_USER@$VPS_IP" -ForegroundColor Gray
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\App.js") -or -not (Test-Path ".\server")) {
    Write-Host "❌ Error: Please run this script from the nomadway project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Creating remote directory..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_IP" "mkdir -p $PROJECT_DIR"

Write-Host "📤 Uploading project files..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

# Upload essential directories and files
$items = @(
    "server",
    "website", 
    "deployment",
    "package.json",
    "VPS_DEPLOYMENT_README.md"
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Write-Host "   Uploading $item..." -ForegroundColor Gray
        scp -r $item "$VPS_USER@$VPS_IP`:$PROJECT_DIR/"
    }
}

Write-Host ""
Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Connect to VPS: ssh $VPS_USER@$VPS_IP" -ForegroundColor White
Write-Host "   2. Run deployment: cd $PROJECT_DIR/deployment && chmod +x vps-deploy.sh && sudo bash vps-deploy.sh" -ForegroundColor White
Write-Host ""
