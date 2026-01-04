/**
 * Postinstall 스크립트
 * Build Time에 @sparticuz/chromium에서 Chromium 바이너리를 추출하여
 * public/chromium-pack.tar 파일로 패키징
 * 
 * Vercel 배포 가이드 참고:
 * https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Vercel 환경에서만 실행
if (process.env.VERCEL || process.env.CI) {
  console.log('[Postinstall] Vercel 환경 감지, Chromium 패키징 시작...');
  
  try {
    // public 디렉토리 생성
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // @sparticuz/chromium 패키지 경로 찾기
    const chromiumPath = path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium');
    
    if (!fs.existsSync(chromiumPath)) {
      console.warn('[Postinstall] @sparticuz/chromium을 찾을 수 없습니다. devDependencies에 설치되어 있는지 확인하세요.');
      return;
    }
    
    // chromium 바이너리 디렉토리 찾기
    const binPath = path.join(chromiumPath, 'bin');
    if (!fs.existsSync(binPath)) {
      console.warn('[Postinstall] Chromium bin 디렉토리를 찾을 수 없습니다.');
      return;
    }
    
    // tar 파일 생성
    const tarPath = path.join(publicDir, 'chromium-pack.tar');
    const cwd = chromiumPath;
    
    console.log('[Postinstall] Chromium 바이너리를 tar 파일로 패키징 중...');
    execSync(`tar -czf "${tarPath}" -C "${binPath}" .`, { stdio: 'inherit' });
    
    console.log('[Postinstall] Chromium 패키징 완료:', tarPath);
  } catch (error) {
    console.error('[Postinstall] 에러:', error.message);
    // 에러가 발생해도 빌드를 계속 진행
  }
} else {
  console.log('[Postinstall] 로컬 환경에서는 스킵됩니다.');
}

