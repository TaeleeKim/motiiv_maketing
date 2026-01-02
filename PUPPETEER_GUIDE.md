# Puppeteer를 사용한 React/SPA 크롤링

## 문제 상황

React, Vue, Angular 등으로 만들어진 SPA(Single Page Application)는 클라이언트 사이드 렌더링(CSR)을 사용합니다.

### 일반 크롤링의 한계

```typescript
// Axios + Cheerio (일반 크롤링)
const response = await axios.get('https://react-app.com');
// → JavaScript가 실행되기 전의 빈 HTML만 가져옴

console.log(response.data);
// <div id="root"></div>  ← 비어있음!
```

React 앱은 브라우저에서 JavaScript가 실행된 후에 내용이 채워지므로, 일반 크롤링으로는 내용을 가져올 수 없습니다.

## 해결 방법: Puppeteer

Puppeteer는 실제 Chrome 브라우저를 자동화하여 JavaScript를 실행하고 렌더링된 결과를 가져옵니다.

### 작동 방식

```
일반 크롤링:
URL → HTML 다운로드 → 파싱
(JavaScript 실행 안 됨)

Puppeteer:
URL → Chrome 실행 → JavaScript 실행 → 렌더링 대기 → HTML 파싱
(실제 브라우저처럼 동작)
```

## 설치

```bash
npm install puppeteer
```

**주의**: Puppeteer는 Chrome을 다운로드하므로 설치 시간이 좀 걸립니다 (~170MB).

## 사용 방법

### 1. 자동 감지 (현재 구현)

프로젝트에 이미 구현되어 있습니다:

```typescript
// src/lib/scraper.ts
export async function scrapeUrl(url: string) {
  // motiiv.ai 도메인은 자동으로 Puppeteer 사용
  if (url.includes('motiiv.ai')) {
    return scrapeUrlWithPuppeteer(url);
  }
  
  // 다른 URL은 일반 크롤링
  return scrapeUrlNormal(url);
}
```

### 2. SPA 도메인 추가

다른 React 사이트를 크롤링하려면:

```typescript
// src/lib/scraper.ts
function isSPAUrl(url: string): boolean {
  if (url.includes('motiiv.ai') || url.includes('motiiv.com')) {
    return true;
  }
  
  // 추가할 도메인
  if (url.includes('your-react-app.com')) {
    return true;
  }
  
  return false;
}
```

## Puppeteer vs 일반 크롤링 비교

| 항목 | 일반 크롤링 | Puppeteer |
|------|-------------|-----------|
| 속도 | 빠름 (~1초) | 느림 (~5-10초) |
| 리소스 | 적음 | 많음 (메모리, CPU) |
| JavaScript | 실행 안 됨 | 실행됨 ✅ |
| React/Vue | 불가능 ❌ | 가능 ✅ |
| 비용 | 저렴 | 비싸 (서버리스에서) |

## 성능 최적화

### 1. 필요한 경우에만 사용

```typescript
// ✅ 좋음: 도메인 기반 자동 감지
if (isSPAUrl(url)) {
  return scrapeUrlWithPuppeteer(url);
}

// ❌ 나쁨: 모든 URL에 Puppeteer 사용
return scrapeUrlWithPuppeteer(url);
```

### 2. 대기 시간 최적화

```typescript
await page.goto(url, {
  waitUntil: 'networkidle2', // 네트워크 안정화 대기
  timeout: 30000,            // 30초 타임아웃
});
```

**waitUntil 옵션**:
- `load`: DOM 로드 완료 (빠름)
- `domcontentloaded`: HTML 파싱 완료 (더 빠름)
- `networkidle0`: 500ms 동안 네트워크 요청 없음 (느림)
- `networkidle2`: 500ms 동안 최대 2개 연결 (권장)

### 3. 불필요한 리소스 차단

```typescript
await page.setRequestInterception(true);
page.on('request', (req) => {
  // 이미지, 폰트, CSS 차단으로 속도 향상
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});
```

## 배포 시 주의사항

### Vercel/Netlify (서버리스)

Puppeteer는 서버리스 환경에서 제한이 있습니다:

**문제점**:
- Chrome 바이너리가 너무 큼
- 메모리 제한 (128MB-1GB)
- 실행 시간 제한 (10-30초)

**해결 방법**:

#### 옵션 1: chrome-aws-lambda 사용

```bash
npm install chrome-aws-lambda puppeteer-core
```

```typescript
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath,
  headless: chromium.headless,
});
```

#### 옵션 2: 외부 서비스 사용

- **ScrapingBee**: https://www.scrapingbee.com
- **Browserless**: https://browserless.io
- **Apify**: https://apify.com

```typescript
// ScrapingBee 예시
const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
  params: {
    api_key: process.env.SCRAPINGBEE_API_KEY,
    url: targetUrl,
    render_js: true,
  }
});
```

#### 옵션 3: Docker 컨테이너 배포

```dockerfile
FROM node:18

# Puppeteer 의존성 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

CMD ["npm", "start"]
```

## 개발 환경 테스트

```bash
# 1. Puppeteer 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. MOTIIV URL로 테스트
# 브라우저에서 http://localhost:3000
# URL 입력: https://motiiv.ai/en/article/view/467
```

## 디버깅

### 브라우저 화면 보기

```typescript
const browser = await puppeteer.launch({
  headless: false, // 브라우저 창 표시
  slowMo: 100,     // 동작 느리게 (관찰용)
});
```

### 스크린샷 저장

```typescript
await page.screenshot({ 
  path: 'debug.png',
  fullPage: true 
});
```

### 콘솔 로그 출력

```typescript
page.on('console', msg => {
  console.log('[Browser Console]', msg.text());
});
```

## 현재 구현 상태

✅ **완료**:
- Puppeteer 크롤러 구현 (`puppeteer-scraper.ts`)
- 자동 감지 로직 (MOTIIV 도메인)
- 일반 크롤링과 자동 선택
- 에러 처리 및 로깅

📝 **필요 시 추가**:
- 다른 SPA 도메인 추가
- 리소스 차단으로 속도 향상
- 서버리스 배포용 최적화

## 참고 자료

- [Puppeteer 공식 문서](https://pptr.dev/)
- [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda)
- [Puppeteer 예제](https://github.com/puppeteer/puppeteer/tree/main/examples)

