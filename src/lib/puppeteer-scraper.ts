import { SEOInfo } from './scraper';

export async function scrapeUrlWithPuppeteer(url: string): Promise<{ title: string; content: string; seoInfo: SEOInfo }> {
  let browser: any;
  
  try {
    console.log('[Puppeteer] 브라우저 시작:', url);
    
    // Vercel 환경 감지
    const isVercel = !!process.env.VERCEL;
    
    // Vercel 환경에서는 @sparticuz/chromium + puppeteer-core 사용
    if (isVercel) {
      console.log('[Puppeteer] Vercel 환경 감지, @sparticuz/chromium 사용');
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerCore = await import('puppeteer-core');
      
      // chromium 모듈에서 실제 chromium 객체 가져오기
      const chromium = (chromiumModule.default || chromiumModule) as any;
      
      // setGraphicsMode 설정 (있는 경우에만)
      if (typeof chromium.setGraphicsMode === 'function') {
        chromium.setGraphicsMode(false);
      }
      
      // chromium 속성 안전하게 가져오기
      const chromiumArgs = Array.isArray(chromium.args) ? chromium.args : [];
      const chromiumViewport = chromium.defaultViewport || { width: 1280, height: 720 };
      
      // executablePath 가져오기 (함수인 경우 await)
      let chromiumExecutablePath: string;
      const executablePathValue = chromium.executablePath;
      if (typeof executablePathValue === 'function') {
        chromiumExecutablePath = await executablePathValue();
      } else if (typeof executablePathValue === 'string') {
        chromiumExecutablePath = executablePathValue;
      } else {
        throw new Error('Chromium executablePath를 찾을 수 없습니다.');
      }
      
      const chromiumHeadless = chromium.headless !== undefined ? chromium.headless : true;
      
      browser = await puppeteerCore.default.launch({
        args: [...chromiumArgs, '--hide-scrollbars', '--disable-web-security'],
        defaultViewport: chromiumViewport,
        executablePath: chromiumExecutablePath,
        headless: chromiumHeadless,
      });
    } else {
      // 로컬 환경에서는 일반 puppeteer 사용
      console.log('[Puppeteer] 로컬 환경, 일반 puppeteer 사용');
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
    }

    const page = await browser.newPage();
    
    // 타임아웃 및 User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // 페이지 로드 (JavaScript 실행 대기)
    await page.goto(url, {
      waitUntil: 'networkidle2', // 네트워크가 안정화될 때까지 대기
      timeout: 30000,
    });

    console.log('[Puppeteer] 페이지 로드 완료, 콘텐츠 추출 중...');

    // JavaScript로 콘텐츠 추출
    const result = await page.evaluate(() => {
      // 불필요한 요소 제거
      const selectorsToRemove = [
        'script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript',
        'aside', '.sidebar', '.advertisement', '.ad', '.ads',
        '.cookie-banner', '.social-share', '.related-posts',
        '.comments', '#comments', '.comment-section',
        'button', '.button', '.btn', 'form',
        '.menu', '.navigation', '.breadcrumb',
      ];

      selectorsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });

      // 제목 추출
      const title = document.title || 
                    document.querySelector('h1')?.textContent || 
                    'No title';

      // 본문 추출 (여러 선택자 시도)
      let content = '';
      
      const articleSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content',
        '.content',
        '.post-body',
        '.article-body',
      ];

      for (const selector of articleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          content = element.textContent;
          break;
        }
      }

      // 선택자로 찾지 못한 경우 body 전체
      if (!content) {
        content = document.body.textContent || '';
      }

      // 공백 정리
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // SEO 정보 추출
      const seoInfo: Record<string, any> = {};
      
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                              document.querySelector('meta[property="og:description"]')?.getAttribute('content');
      if (metaDescription) {
        seoInfo.description = metaDescription.trim();
      }

      const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
      if (metaKeywords) {
        seoInfo.keywords = metaKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      }

      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) {
        seoInfo.ogTitle = ogTitle.trim();
      }

      const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
      if (ogDescription) {
        seoInfo.ogDescription = ogDescription.trim();
      }

      const ogKeywords = document.querySelector('meta[property="og:keywords"]')?.getAttribute('content');
      if (ogKeywords) {
        seoInfo.ogKeywords = ogKeywords.trim();
      }

      return { title, content, seoInfo };
    });

    console.log('[Puppeteer] 추출 완료 - 제목:', result.title.substring(0, 50), ', 길이:', result.content.length, '자');
    console.log('[Puppeteer] SEO 정보 추출:', {
      description: result.seoInfo.description?.substring(0, 50),
      keywords: result.seoInfo.keywords?.length || 0,
      ogTitle: result.seoInfo.ogTitle?.substring(0, 50),
    });

    // 내용이 너무 짧으면 에러
    if (result.content.length < 50) {
      throw new Error('추출된 내용이 너무 짧습니다. 페이지 구조를 확인하세요.');
    }

    // 최대 5,000자로 제한
    result.content = result.content.substring(0, 5000);

    return result;
  } catch (error) {
    console.error('[Puppeteer] 에러:', error);
    throw new Error(`Puppeteer 크롤링 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('[Puppeteer] 브라우저 종료');
    }
  }
}

