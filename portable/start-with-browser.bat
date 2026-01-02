@echo off
chcp 65001 >nul
title MOTIIV 마케팅 자동화 도구

echo ============================================
echo   MOTIIV 마케팅 자동화 도구
echo ============================================
echo.

:: 현재 스크립트 위치로 이동
cd /d "%~dp0"

:: Node.js 경로 설정
set "NODE_PATH=%~dp0node"
set "PATH=%NODE_PATH%;%PATH%"

:: 환경변수 파일 확인
if not exist ".env.local" (
    echo [오류] .env.local 파일이 없습니다!
    echo.
    echo .env.example 파일을 복사하여 .env.local 파일을 만들고
    echo API 키를 설정해주세요.
    echo.
    pause
    exit /b 1
)

:: Node.js 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js를 찾을 수 없습니다.
    echo node 폴더에 Node.js가 설치되어 있는지 확인해주세요.
    pause
    exit /b 1
)

echo Node.js 버전:
node --version
echo.

:: 3초 후 브라우저 자동 열기
echo 3초 후 브라우저가 자동으로 열립니다...
timeout /t 3 /nobreak >nul
start http://localhost:3000

:: 서버 시작
echo.
echo 서버가 실행 중입니다...
echo 종료하려면 이 창을 닫거나 Ctrl+C를 누르세요.
echo ============================================
echo.

:: standalone 서버 실행
node server.js

pause

