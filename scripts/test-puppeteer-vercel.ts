/**
 * 로컬에서 Vercel 환경과 동일하게 Puppeteer 테스트
 * 
 * 사용법:
 *   npm run test:puppeteer:vercel
 *   npm run test:puppeteer:vercel https://example.com
 */

import { scrapeUrlWithPuppeteer } from '../src/lib/puppeteer-scraper';

async function testPuppeteerVercel() {
  console.log('[테스트] Vercel 환경 시뮬레이션 모드로 Puppeteer 테스트 시작');
  console.log('[테스트] 환경 변수:', {
    VERCEL: process.env.VERCEL,
    USE_VERCEL_CHROMIUM: process.env.USE_VERCEL_CHROMIUM,
  });

  const testUrl = process.argv[2] || 'https://example.com';

  try {
    console.log(`[테스트] URL 크롤링 시작: ${testUrl}`);
    const result = await scrapeUrlWithPuppeteer(testUrl);
    
    console.log('\n[테스트] 성공!');
    console.log('[테스트] 제목:', result.title);
    console.log('[테스트] 콘텐츠 길이:', result.content.length, '자');
    console.log('[테스트] 콘텐츠 미리보기:', result.content.substring(0, 200) + '...');
    console.log('[테스트] SEO 정보:', {
      description: result.seoInfo.description?.substring(0, 50),
      keywords: result.seoInfo.keywords?.length || 0,
      ogTitle: result.seoInfo.ogTitle?.substring(0, 50),
    });
    
    process.exit(0);
  } catch (error) {
    console.error('\n[테스트] 실패:');
    console.error(error);
    process.exit(1);
  }
}

testPuppeteerVercel();

