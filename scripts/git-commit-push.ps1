# Локально (Windows / PowerShell): закоммитить и отправить в удалённый репозиторий.
# Запуск из корня репозитория:
#   .\scripts\git-commit-push.ps1 -Message "описание изменений"
param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"
# Корень репозитория (папка на уровень выше scripts/)
Set-Location (Split-Path $PSScriptRoot)

git status
git add -A
git commit -m $Message
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
git push -u origin $branch
