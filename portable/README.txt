============================================
  MOTIIV 마케팅 자동화 도구
  사용 설명서
============================================

■ 프로그램 소개
  URL 콘텐츠를 분석하고, AI로 키워드를 추출하여
  댓글을 달 수 있는 커뮤니티 페이지를 자동으로 추천합니다.


■ 최초 설정 (한 번만 하면 됩니다)

  1. API 키 발급
     - OpenAI: https://platform.openai.com/api-keys
     - Serper: https://serper.dev (무료 가입)

  2. 환경 변수 설정
     - .env.example 파일을 복사하여 .env.local 파일 생성
     - 메모장으로 .env.local 열기
     - OPENAI_API_KEY= 뒤에 OpenAI API 키 입력
     - SERPER_API_KEY= 뒤에 Serper API 키 입력
     - 저장 후 닫기


■ 프로그램 실행

  방법 1: start-with-browser.bat 더블클릭
          → 서버 시작 + 브라우저 자동 열림

  방법 2: start.bat 더블클릭
          → 서버만 시작
          → 브라우저에서 http://localhost:3000 직접 열기


■ 사용 방법

  1. 분석할 URL을 입력창에 붙여넣기
  2. "분석 시작" 버튼 클릭
  3. 결과 확인:
     - 콘텐츠 요약
     - 추출된 키워드
     - AI가 생성한 댓글 초안
     - 댓글 달 수 있는 추천 페이지 목록


■ 프로그램 종료

  - 실행 중인 명령 프롬프트 창을 닫기
  - 또는 Ctrl+C 누르기


■ 문제 해결

  Q: "Node.js를 찾을 수 없습니다" 오류
  A: node 폴더가 비어있거나 없습니다.
     Node.js portable 버전을 node 폴더에 복사해주세요.

  Q: ".env.local 파일이 없습니다" 오류  
  A: .env.example 파일을 복사해서 .env.local로 이름 변경 후
     API 키를 입력해주세요.

  Q: API 오류가 발생합니다
  A: .env.local 파일의 API 키가 올바른지 확인해주세요.
     키 앞뒤에 공백이 없어야 합니다.

  Q: 브라우저에서 페이지가 안 열립니다
  A: http://localhost:3000 주소를 직접 입력해보세요.
     방화벽이 차단하고 있을 수 있습니다.


■ 폴더 구조

  motiiv-portable/
  ├── node/                  # Node.js 실행 파일
  ├── .next/                 # Next.js 빌드 파일
  ├── server.js              # 서버 실행 파일
  ├── .env.local             # 환경 설정 (API 키)
  ├── .env.example           # 환경 설정 예시
  ├── start.bat              # 실행 파일
  ├── start-with-browser.bat # 브라우저 포함 실행
  └── README.txt             # 이 파일


■ 문의

  문제가 해결되지 않으면 개발자에게 문의해주세요.

============================================

