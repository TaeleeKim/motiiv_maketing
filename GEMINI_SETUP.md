# Google Gemini API 설정 (무료)

OpenAI API 할당량 문제가 발생했을 때 무료 대안으로 Google Gemini를 사용할 수 있습니다.

## 중요: 보안 경고

**절대 API 키를 코드에 하드코딩하지 마세요!** 환경 변수를 사용하세요.

## Gemini API Key 발급 (무료)

### 1. Google AI Studio 접속

https://aistudio.google.com/app/apikey

### 2. API Key 생성

1. "Create API Key" 클릭
2. Google 계정으로 로그인
3. API Key 복사

### 3. 무료 할당량

- **무료 티어**: 15 RPM (분당 요청), 1,500 RPD (일일 요청)
- **비용**: 완전 무료
- **모델**: Gemini 2.0 Flash (최신, 가장 빠름)

## 환경 변수 설정

`.env.local` 파일에 추가:

```bash
# Google Gemini API Key (무료)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (선택사항)
# OPENAI_API_KEY=your_openai_api_key_here

# Serper API Key (검색용)
SERPER_API_KEY=your_serper_api_key_here
```

## API 전환 방법

### 현재: Gemini 사용 중 (기본)

```typescript
// src/app/api/process/route.ts
import { analyzeContent } from '@/lib/gemini';
```

### OpenAI로 변경하려면

```typescript
// src/app/api/process/route.ts
import { analyzeContent } from '@/lib/openai';
```

한 줄만 변경하면 됩니다.

## 성능 비교

| 항목 | Google Gemini 2.0 | OpenAI GPT-4o-mini |
|------|-------------------|-------------------|
| 비용 | 무료 | 유료 ($0.15/1M tokens) |
| 속도 | 매우 빠름 | 빠름 |
| 품질 | 우수 | 우수 |
| 할당량 | 15 RPM, 1,500 RPD | 크레딧 기반 |
| SDK | @google/genai | openai |

## 문제 해결

### API Key 오류

```
GEMINI_API_KEY 설정되지 않았습니다.
```

**해결**: `.env.local` 파일 확인 및 개발 서버 재시작

```bash
# 서버 재시작
npm run dev
```

### 할당량 초과

Gemini 무료 티어는 분당 60회 요청 제한이 있습니다. 
여러 URL을 동시에 처리하면 제한에 걸릴 수 있으니 
URL 개수를 줄이거나 시간 간격을 두고 재시도하세요.

## 추가 정보

- [Gemini API 문서](https://ai.google.dev/docs)
- [API Key 관리](https://aistudio.google.com/app/apikey)
- [가격 정책](https://ai.google.dev/pricing)

