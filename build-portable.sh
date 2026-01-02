#!/bin/bash

echo "============================================"
echo "  MOTIIV 포터블 패키지 빌드"
echo "============================================"
echo ""

# 현재 디렉토리 저장
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$PROJECT_DIR/dist/motiiv-portable"

# 기존 dist 폴더 삭제
if [ -d "$PROJECT_DIR/dist" ]; then
    echo "기존 빌드 폴더 삭제 중..."
    rm -rf "$PROJECT_DIR/dist"
fi

# 출력 폴더 생성
echo "출력 폴더 생성 중..."
mkdir -p "$OUTPUT_DIR"

# 1. Next.js 빌드
echo ""
echo "[1/5] Next.js 빌드 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "[오류] 빌드 실패!"
    exit 1
fi

# 2. standalone 폴더 복사
echo ""
echo "[2/5] 빌드 결과물 복사 중..."
cp -r "$PROJECT_DIR/.next/standalone/"* "$OUTPUT_DIR/"
mkdir -p "$OUTPUT_DIR/.next/static"
cp -r "$PROJECT_DIR/.next/static/"* "$OUTPUT_DIR/.next/static/"
if [ -d "$PROJECT_DIR/public" ]; then
    cp -r "$PROJECT_DIR/public" "$OUTPUT_DIR/"
fi

# 3. 실행 파일 복사
echo ""
echo "[3/5] 실행 파일 복사 중..."
cp "$PROJECT_DIR/portable/start.bat" "$OUTPUT_DIR/"
cp "$PROJECT_DIR/portable/start-with-browser.bat" "$OUTPUT_DIR/"
cp "$PROJECT_DIR/portable/env-example.txt" "$OUTPUT_DIR/"
cp "$PROJECT_DIR/portable/README.txt" "$OUTPUT_DIR/"

# 4. Node.js 폴더 생성
echo ""
echo "[4/5] Node.js 설정..."
mkdir -p "$OUTPUT_DIR/node"

# 5. 완료
echo ""
echo "[5/5] 빌드 완료!"
echo ""
echo "============================================"
echo "출력 위치: $OUTPUT_DIR"
echo "============================================"
echo ""
echo "배포 전 확인 사항:"
echo ""
echo "  1. Node.js Windows portable 다운로드:"
echo "     https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
echo ""
echo "  2. 다운로드한 zip 파일 압축 해제 후"
echo "     내용물을 dist/motiiv-portable/node 폴더에 복사"
echo "     (node.exe가 node 폴더 바로 안에 있어야 함)"
echo ""
echo "  3. 받는 사람에게 전달할 내용:"
echo "     - env-example.txt를 .env.local로 이름 변경"
echo "     - API 키 입력"
echo "     - start-with-browser.bat 더블클릭으로 실행"
echo ""
echo "  4. 전체 폴더를 zip으로 압축하여 배포"
echo ""

