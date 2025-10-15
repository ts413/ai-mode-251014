# tpkill.ps1 - tpkill 대체 스크립트
param(
    [string]$f = ""
)

if ($f -eq "") {
    Write-Host "사용법: .\tpkill.ps1 -f 'process_pattern'"
    Write-Host "예시: .\tpkill.ps1 -f 'next|pnpm dev'"
    exit 1
}

# 패턴을 파싱하여 프로세스 이름 추출
$patterns = $f -split '\|'

foreach ($pattern in $patterns) {
    $pattern = $pattern.Trim()
    
    if ($pattern -like "*next*") {
        Write-Host "Next.js 프로세스 종료 중..."
        Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    if ($pattern -like "*pnpm*") {
        Write-Host "pnpm 프로세스 종료 중..."
        Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*pnpm*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    if ($pattern -like "*dev*") {
        Write-Host "개발 서버 프로세스 종료 중..."
        Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*dev*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "프로세스 종료 완료!"
