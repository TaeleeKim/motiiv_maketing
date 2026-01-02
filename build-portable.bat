@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   MOTIIV 포터블 패키지 빌드
echo ============================================
echo.

:: 현재 디렉토리 저장
set "PROJECT_DIR=%~dp0"
set "OUTPUT_DIR=%PROJECT_DIR%dist\motiiv-portable"
set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
set "NODE_ZIP=%PROJECT_DIR%dist\node-win.zip"

:: Node.js 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 Node.js를 먼저 설치해주세요.
    pause
    exit /b 1
)

:: 기존 dist 폴더 삭제
if exist "%PROJECT_DIR%dist" (
    echo 기존 빌드 폴더 삭제 중...
    rmdir /s /q "%PROJECT_DIR%dist"
)

:: 출력 폴더 생성
echo 출력 폴더 생성 중...
mkdir "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\node"

:: 1. Next.js 빌드
echo.
echo [1/5] Next.js 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo [오류] 빌드 실패!
    pause
    exit /b 1
)

:: 2. standalone 폴더 복사
echo.
echo [2/5] 빌드 결과물 복사 중...
xcopy /E /I /Y "%PROJECT_DIR%.next\standalone\*" "%OUTPUT_DIR%\" >nul
xcopy /E /I /Y "%PROJECT_DIR%.next\static" "%OUTPUT_DIR%\.next\static\" >nul
if exist "%PROJECT_DIR%public" (
    xcopy /E /I /Y "%PROJECT_DIR%public" "%OUTPUT_DIR%\public\" >nul
)

:: 3. 실행 파일 복사
echo.
echo [3/5] 실행 파일 복사 중...
copy /Y "%PROJECT_DIR%portable\start.bat" "%OUTPUT_DIR%\" >nul
copy /Y "%PROJECT_DIR%portable\start-with-browser.bat" "%OUTPUT_DIR%\" >nul
copy /Y "%PROJECT_DIR%portable\env-example.txt" "%OUTPUT_DIR%\" >nul
copy /Y "%PROJECT_DIR%portable\README.txt" "%OUTPUT_DIR%\" >nul

:: 4. Node.js portable 다운로드
echo.
echo [4/5] Node.js portable 다운로드 중...
echo     (약 30MB, 시간이 걸릴 수 있습니다)

:: PowerShell로 다운로드
powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'" 2>nul
if %errorlevel% neq 0 (
    :: curl로 재시도
    curl -L -o "%NODE_ZIP%" "%NODE_URL%" 2>nul
)

if exist "%NODE_ZIP%" (
    echo     압축 해제 중...
    powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%PROJECT_DIR%dist\temp' -Force"
    xcopy /E /I /Y "%PROJECT_DIR%dist\temp\node-v20.11.0-win-x64\*" "%OUTPUT_DIR%\node\" >nul
    rmdir /s /q "%PROJECT_DIR%dist\temp"
    del "%NODE_ZIP%"
    echo     Node.js 설치 완료!
) else (
    echo [경고] Node.js 자동 다운로드 실패
    echo 수동으로 다운로드해주세요:
    echo   1. %NODE_URL% 다운로드
    echo   2. 압축 해제 후 내용물을 dist\motiiv-portable\node 폴더에 복사
)

:: 5. ZIP 압축
echo.
echo [5/5] ZIP 파일 생성 중...
powershell -Command "Compress-Archive -Path '%OUTPUT_DIR%' -DestinationPath '%PROJECT_DIR%dist\motiiv-portable.zip' -Force"

:: 완료
echo.
echo ============================================
echo   빌드 완료!
echo ============================================
echo.
echo 생성된 파일:
echo   - 폴더: dist\motiiv-portable\
echo   - ZIP:  dist\motiiv-portable.zip
echo.
echo 배포 방법:
echo   1. dist\motiiv-portable.zip 파일을 상대방에게 전달
echo   2. 받는 사람은 압축 해제 후 README.txt 참고
echo.

pause

