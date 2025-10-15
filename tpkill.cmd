@echo off
powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*node*'} | Stop-Process -Force"
echo 프로세스 종료 완료!
