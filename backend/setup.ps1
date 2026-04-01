param(
    [string]$PythonVersion = "3.12"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot "venv"
$pythonExe = Join-Path $venvPath "Scripts\\python.exe"
$requirementsPath = Join-Path $projectRoot "requirements.txt"

if ($env:VIRTUAL_ENV -and ($env:VIRTUAL_ENV -ne $venvPath)) {
    Write-Warning "Active virtualenv '$($env:VIRTUAL_ENV)' does not match backend standard '$venvPath'."
    Write-Warning "Using backend/venv for installation anyway."
}

if (-not (Test-Path $pythonExe)) {
    Write-Host "Creating backend virtualenv at $venvPath using Python $PythonVersion ..."
    py "-$PythonVersion" -m venv $venvPath
}

Write-Host "Upgrading pip ..."
& $pythonExe -m pip install --upgrade pip

Write-Host "Installing backend requirements ..."
& $pythonExe -m pip install -r $requirementsPath

Write-Host ""
Write-Host "Backend environment is ready."
Write-Host "Run the backend with:"
Write-Host "  $pythonExe main.py"
