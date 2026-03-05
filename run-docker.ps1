# Run the full stack (MongoDB + app) in the terminal
# Usage: .\run-docker.ps1   or   docker compose up --build
Set-Location $PSScriptRoot
docker compose up --build
