# MOTIIV 마케팅 자동화 도구

URL 콘텐츠를 분석하고, 관련 키워드를 추출하여, 댓글을 달 수 있는 커뮤니티 페이지를 자동으로 추천하는 도구입니다.

## 주요 기능

1. **URL 크롤링 및 분석**
   - 스프레드시트, 아티클, 블로그 등 다양한 URL 지원
   - 자동으로 본문 텍스트 추출

2. **AI 기반 콘텐츠 분석**
   - OpenAI GPT를 활용한 요약 생성
   - 타겟 독자 관점의 핵심 키워드 5개 추출
   - 자연스러운 댓글 초안 자동 생성

3. **관련 페이지 검색**
   - 추출된 키워드로 Google 검색
   - 커뮤니티, 블로그, 포럼, Reddit 등에서 댓글 대상 찾기
   - 최신 게시물 우선 추천

4. **마케팅 성과 추적**
   - UTM 파라미터 자동 생성
   - 출처별 클릭 추적 가능
   - 효율적인 채널 분석 지원

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```bash
# OpenAI API Key (요약 및 키워드 추출용)
OPENAI_API_KEY=your_openai_api_key_here

# Serper API Key (검색용)
SERPER_API_KEY=your_serper_api_key_here
```

#### API Key 발급 방법

- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Serper API Key**: https://serper.dev (무료 플랜: 2,500 검색/월)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 사용하세요.

## 사용 방법

1. **URL 입력**
   - 분석할 URL을 한 줄에 하나씩 입력
   - 여러 개의 URL을 동시에 처리 가능

2. **옵션 설정**
   - 타겟 독자: 기본값은 "구조/토목 엔지니어"
   - 키워드 언어: 한국어, 영어, 또는 혼합

3. **결과 확인**
   - 각 URL의 요약과 키워드 확인
   - AI가 생성한 댓글 초안 확인
   - 추천된 커뮤니티 페이지 목록 확인

4. **마케팅 실행**
   - 댓글 초안을 참고하여 자연스러운 댓글 작성
   - UTM 파라미터가 포함된 링크 사용
   - 성과 추적 (Google Analytics 또는 HubSpot)

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4o-mini
- **검색**: Serper API (Google Search)
- **크롤링**: Cheerio, Axios

## 프로젝트 구조

```
motiiv_marketing/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── process/
│   │   │       └── route.ts        # 메인 API 엔드포인트
│   │   ├── layout.tsx              # 레이아웃
│   │   ├── page.tsx                # 메인 페이지
│   │   └── globals.css             # 글로벌 스타일
│   ├── components/
│   │   ├── UrlInput.tsx            # URL 입력 폼
│   │   └── ResultCard.tsx          # 결과 카드
│   ├── lib/
│   │   ├── scraper.ts              # URL 크롤링
│   │   ├── openai.ts               # OpenAI 연동
│   │   └── search.ts               # 검색 API 연동
│   └── types/
│       └── index.ts                # TypeScript 타입 정의
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 성과 측정

### UTM 파라미터 구조

```
https://motiiv.com?utm_source={domain}&utm_medium=comment&utm_campaign={keyword}
```

### Google Analytics 설정

1. Google Analytics에서 UTM 캠페인 추적 활성화
2. "획득" > "캠페인" > "모든 캠페인"에서 성과 확인
3. 어떤 커뮤니티가 효율적인지 분석

### HubSpot 연동

- HubSpot의 Campaign 기능 활용
- UTM 파라미터로 자동 분류
- 리드 소스 추적

## 개선 계획

- [ ] 단축 URL 서비스 연동 (bit.ly, 자체 도메인)
- [ ] 댓글 히스토리 저ㅌ장 (데이터베이스)
- [ ] 성과 대시보드 추가
- [ ] Reddit, Quora 직접 검색 API 연동
- [ ] 다국어 지원 확대
- [ ] 자동 댓글 스케줄링

## 라이선스

내부용 도구

