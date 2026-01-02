# 환경 변수 설정 가이드

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 내용을 추가하세요:

```bash
# Google Gemini API Key (무료) - 권장
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# 또는 OpenAI API Key (유료)
# OPENAI_API_KEY=your_openai_api_key_here

# Serper API Key (검색용) - https://serper.dev
SERPER_API_KEY=your_serper_api_key_here
```

## API Key 발급 방법

### 1. Google Gemini API Key (무료, 권장)
- https://aistudio.google.com/app/apikey 에서 발급
- 완전 무료, 60 요청/분
- 요약 및 키워드 추출에 사용

### 2. OpenAI API Key (대안)
- https://platform.openai.com/api-keys 에서 발급
- 유료 (크레딧 필요)
- 더 높은 품질 원할 때 사용

### 3. Serper API Key
- https://serper.dev 에서 무료 가입 후 발급
- Google 검색 결과를 가져오는 데 사용
- 무료 플랜: 2,500 검색/월

