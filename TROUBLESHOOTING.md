# 문제 해결 가이드

## Gemini API 404 에러

### 증상
```
AxiosError: Request failed with status code 404
status: 404
statusText: 'Not Found'
```

### 원인
1. API 키가 유효하지 않음
2. API 엔드포인트 URL 오류
3. Gemini API가 활성화되지 않음

### 해결 방법

#### 1. API 키 확인

```bash
# .env.local 파일 확인
cat .env.local | grep GOOGLE_GEMINI_API_KEY
```

API 키가 없거나 잘못된 경우:
1. https://aistudio.google.com/app/apikey 접속
2. 기존 키 삭제 후 새로 생성
3. `.env.local` 파일에 업데이트
4. 개발 서버 재시작

```bash
# 개발 서버 재시작
npm run dev
```

#### 2. API 엔드포인트 수정 완료

최신 코드에서 다음으로 수정되었습니다:
- ~~`/v1beta/`~~ → `/v1/` ✅
- 더 나은 에러 처리 추가 ✅
- 디버깅 로그 추가 ✅

#### 3. API 키 테스트

터미널에서 직접 테스트:

```bash
# API 키를 변수에 저장
export GEMINI_KEY="your_api_key_here"

# API 테스트
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello, test"}]
    }]
  }'
```

**성공 응답**: `200 OK` + JSON 데이터  
**실패 응답**: `404` → API 키 재발급 필요

## 디버깅 포인트가 안 잡히는 문제

### 증상
- 중단점을 설정해도 멈추지 않음
- 서버 사이드 코드 디버깅 불가

### 해결 방법

#### 1. 올바른 디버깅 모드 사용

**API 라우트 디버깅 (서버)**: 
- "Next.js: 서버 사이드 디버깅" 선택
- `F5` 키로 실행
- `/src/app/api/**`, `/src/lib/**` 파일에 중단점 설정

**React 컴포넌트 디버깅 (클라이언트)**:
- "Next.js: 클라이언트 사이드 디버깅" 선택
- 브라우저 DevTools 사용

#### 2. 개발 서버 완전히 재시작

```bash
# 모든 Node 프로세스 종료
pkill -f "node.*next"

# 포트 3000 정리
PORT_PID=$(lsof -ti :3000)
if [ -n "$PORT_PID" ]; then kill -9 $PORT_PID; fi

# .next 빌드 캐시 삭제
rm -rf .next

# 재시작
npm run dev
```

#### 3. 중단점 설정 확인

**올바른 위치**:

```typescript
// src/lib/gemini.ts
export async function analyzeContent(options: AnalyzeOptions) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  // 여기에 중단점 ✅
  console.log('[DEBUG] API Key 존재:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('API 키 없음');
  }
  
  try {
    // 여기에 중단점 ✅
    const response = await axios.post(url, data);
    
    // 여기에 중단점 ✅
    console.log('[DEBUG] 응답:', response.status);
  } catch (error) {
    // 여기에 중단점 ✅ (에러 발생 시)
    console.error('[DEBUG] 에러:', error);
  }
}
```

#### 4. Source Map 확인

`next.config.js`에 추가:

```javascript
module.exports = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};
```

#### 5. 로그 기반 디버깅 (대안)

디버거가 작동하지 않을 때 `console.log` 사용:

```typescript
// src/lib/gemini.ts
export async function analyzeContent(options: AnalyzeOptions) {
  console.log('[1] 함수 시작', { title: options.title });
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  console.log('[2] API Key 확인:', apiKey ? '있음' : '없음');
  
  try {
    console.log('[3] API 호출 시작');
    const response = await axios.post(url, data);
    console.log('[4] API 응답:', response.status);
    
    return result;
  } catch (error) {
    console.log('[ERROR] 에러 발생:', error);
    throw error;
  }
}
```

## OpenAI API 할당량 초과

### 증상
```
RateLimitError: 429 You exceeded your current quota
```

### 해결 방법

코드가 이미 Gemini로 전환되어 있습니다. `.env.local` 확인:

```bash
# Gemini 사용 (무료)
GOOGLE_GEMINI_API_KEY=your_key_here

# OpenAI는 주석 처리
# OPENAI_API_KEY=your_key_here
```

## Serper API 오류

### 증상
```
SERPER_API_KEY가 설정되지 않았습니다.
```

### 해결 방법

1. https://serper.dev 접속
2. 무료 회원가입
3. API Key 복사
4. `.env.local`에 추가:

```bash
SERPER_API_KEY=your_serper_key_here
```

5. 개발 서버 재시작

## 환경 변수가 인식되지 않음

### 해결 방법

```bash
# 1. .env.local 파일 위치 확인 (프로젝트 루트에 있어야 함)
ls -la .env.local

# 2. 파일 내용 확인
cat .env.local

# 3. 개발 서버 완전히 재시작
# Ctrl+C로 종료 후
npm run dev

# 4. 환경 변수 로드 확인
# src/app/api/process/route.ts에 임시 로그 추가:
console.log('ENV Check:', {
  gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
  serper: !!process.env.SERPER_API_KEY,
});
```

## 추가 도움말

문제가 계속되면:
1. 모든 에러 메시지 복사
2. `.env.local` 파일 존재 여부 확인
3. `npm run dev` 실행 로그 확인
4. 브라우저 콘솔과 서버 터미널 모두 확인

