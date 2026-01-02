# 디버깅 가이드

VS Code에서 Next.js 애플리케이션을 디버깅하는 방법을 안내합니다.

## 사전 준비

1. VS Code 확장 프로그램 설치 (선택사항이지만 권장)
   - ESLint
   - Prettier - Code formatter

2. 개발 서버가 실행되지 않은 상태에서 시작

## 디버깅 모드

### 1. 전체 디버깅 (권장)

**사용 시점**: 일반적인 개발 및 디버깅

**실행 방법**:
1. VS Code에서 `F5` 키를 누르거나
2. 왼쪽 사이드바의 "실행 및 디버그" 아이콘 클릭
3. "Next.js: 전체 디버깅" 선택 후 실행

**특징**:
- 개발 서버 자동 시작
- 브라우저 자동 열림
- 기본적인 디버깅 지원

### 2. 풀스택 디버깅

**사용 시점**: 서버와 클라이언트 코드를 동시에 디버깅해야 할 때

**실행 방법**:
1. "실행 및 디버그" 패널에서
2. "Next.js: 풀스택 디버깅" 선택 후 실행

**특징**:
- 서버 사이드와 클라이언트 사이드 동시 디버깅
- API 라우트와 React 컴포넌트 모두 중단점 설정 가능
- 두 개의 디버그 세션이 동시 실행

### 3. 서버 사이드 디버깅

**사용 시점**: API 라우트, 서버 컴포넌트, 백엔드 로직만 디버깅할 때

**실행 방법**:
1. "Next.js: 서버 사이드 디버깅" 선택
2. 브라우저에서 직접 http://localhost:3000 접속

**디버깅 가능한 코드**:
- `/src/app/api/**` (API Routes)
- `/src/lib/**` (서버 사이드 유틸리티)
- Server Components

### 4. 클라이언트 사이드 디버깅

**사용 시점**: React 컴포넌트, 브라우저 로직만 디버깅할 때

**실행 방법**:
1. 먼저 터미널에서 `npm run dev` 실행
2. "Next.js: 클라이언트 사이드 디버깅" 선택

**디버깅 가능한 코드**:
- React 컴포넌트 (`/src/components/**`, `/src/app/**/page.tsx`)
- 클라이언트 사이드 로직
- 브라우저 이벤트 핸들러

## 중단점 설정 방법

### 기본 중단점
1. 코드 라인 번호 왼쪽 클릭 (빨간 점 생성)
2. 디버깅 모드 실행
3. 해당 코드 실행 시 멈춤

### 조건부 중단점
1. 라인 번호 오른쪽 클릭
2. "조건부 중단점 추가" 선택
3. 조건 입력 (예: `urls.length > 1`)

### 로그 포인트
1. 라인 번호 오른쪽 클릭
2. "Logpoint 추가" 선택
3. 로그 메시지 입력 (예: `URL: {url}`)

## 디버깅 예제

### 예제 1: API 라우트 디버깅

```typescript
// src/app/api/process/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { urls } = body;
  
  // 여기에 중단점 설정
  console.log('Processing URLs:', urls);
  
  for (const url of urls) {
    // 여기에 조건부 중단점: url.includes('wikipedia')
    const { title, content } = await scrapeUrl(url);
  }
}
```

**디버깅 방법**:
1. "Next.js: 서버 사이드 디버깅" 실행
2. 위 코드에 중단점 설정
3. 브라우저에서 URL 제출
4. VS Code에서 변수 검사

### 예제 2: React 컴포넌트 디버깅

```typescript
// src/app/page.tsx
const handleSubmit = async (urls: string[], options: {...}) => {
  setLoading(true);
  
  // 여기에 중단점 설정
  const response = await fetch('/api/process', {...});
  
  // 여기에 로그 포인트: 'Response status: {response.status}'
  const data = await response.json();
};
```

**디버깅 방법**:
1. "Next.js: 클라이언트 사이드 디버깅" 실행
2. 위 코드에 중단점 설정
3. 브라우저에서 폼 제출
4. Chrome DevTools와 VS Code 동시 사용 가능

### 예제 3: 크롤링 함수 디버깅

```typescript
// src/lib/scraper.ts
export async function scrapeUrl(url: string) {
  try {
    // 여기에 중단점
    const response = await axios.get(url, {...});
    const $ = cheerio.load(response.data);
    
    // 조건부 중단점: title.length === 0
    const title = $('title').text() || 'No title';
    
    return { title, content };
  } catch (error) {
    // 여기에 중단점 (에러 처리 확인)
    throw new Error(`URL 크롤링 실패: ${error.message}`);
  }
}
```

## 디버깅 팁

### 변수 검사
- **로컬 변수**: 왼쪽 "변수" 패널에서 확인
- **조사식**: `+` 버튼으로 표현식 추가 (예: `urls.length`)
- **호버**: 코드 위에 마우스를 올려 값 확인

### 콜 스택
- 함수 호출 순서 확인
- 스택의 각 프레임 클릭하여 해당 시점의 변수 확인

### 디버그 콘솔
- `Ctrl + Shift + Y` (Windows/Linux) 또는 `Cmd + Shift + Y` (Mac)
- 실시간으로 표현식 평가 가능

### 단계별 실행
- **F10**: Step Over (다음 줄로)
- **F11**: Step Into (함수 안으로)
- **Shift + F11**: Step Out (함수 밖으로)
- **F5**: Continue (다음 중단점까지)

## 문제 해결

### 중단점이 작동하지 않는 경우

1. **서버 사이드 코드**
   - "Next.js: 서버 사이드 디버깅" 모드 사용 확인
   - `.next` 폴더 삭제 후 재시작

2. **클라이언트 사이드 코드**
   - 소스 맵 활성화 확인
   - 브라우저 캐시 클리어

3. **TypeScript 파일**
   - 빌드된 JavaScript 파일이 아닌 원본 TS 파일에 중단점 설정

### 포트 충돌

```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```

launch.json에서도 URL 수정 필요:
```json
"url": "http://localhost:3001"
```

### Source Map 문제

`next.config.js`에 추가:
```javascript
module.exports = {
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.devtool = 'source-map';
    return config;
  },
};
```

## 추가 리소스

- [Next.js 디버깅 공식 문서](https://nextjs.org/docs/pages/building-your-application/configuring/debugging)
- [VS Code 디버깅 가이드](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

