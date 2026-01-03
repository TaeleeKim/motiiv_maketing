import { SEOInfo } from './scraper';

export async function scrapeUrlWithPuppeteer(url: string): Promise<{ title: string; content: string; seoInfo: SEOInfo }> {
  let browser: any;
  
  try {
    console.log('[Puppeteer] 브라우저 시작:', url);
    
    // Vercel 환경 감지
    // 로컬에서는 USE_VERCEL_CHROMIUM을 설정해도 실제 Vercel 환경이 아니면 일반 puppeteer 사용
    // 실제 Vercel 배포 환경에서만 @sparticuz/chromium 사용
    const isVercel = !!process.env.VERCEL;
    
    // Vercel 환경에서는 @sparticuz/chromium + puppeteer-core 사용
    if (isVercel) {
      console.log('[Puppeteer] Vercel 환경 감지, @sparticuz/chromium 사용');
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerCore = await import('puppeteer-core');
      
      // chromium 모듈에서 실제 chromium 객체 가져오기
      // default export가 있으면 사용, 없으면 전체 모듈 사용
      let chromium: any;
      if (chromiumModule.default) {
        chromium = chromiumModule.default;
      } else {
        chromium = chromiumModule;
      }
      
      // chromium 객체가 유효한지 확인
      if (!chromium) {
        throw new Error('Chromium 모듈을 로드할 수 없습니다.');
      }
      
      // chromium 속성 안전하게 가져오기
      // 버전 119는 안정적이며 graphics 속성 문제가 없음
      const chromiumArgs = Array.isArray(chromium.args) ? chromium.args : [];
      const chromiumViewport = chromium.defaultViewport || { width: 1280, height: 720 };
      
      // executablePath 가져오기
      // GitHub 이슈 #5662 참고: 실행 파일 경로 문제 해결
      // https://github.com/puppeteer/puppeteer/issues/5662
      let chromiumExecutablePath: string;
      try {
        // chromium.executablePath() 함수 호출
        // 이 함수는 Chromium 바이너리의 실제 경로를 반환해야 함
        if (typeof chromium.executablePath === 'function') {
          chromiumExecutablePath = await chromium.executablePath();
          console.log('[Puppeteer] Chromium executablePath (함수):', chromiumExecutablePath);
          
          // 경로가 유효한지 확인
          if (!chromiumExecutablePath || chromiumExecutablePath.trim() === '') {
            throw new Error('Chromium executablePath가 비어있습니다.');
          }
          
          // 경로 형식 검증 (Vercel 환경에서는 /var/task/로 시작해야 함)
          if (!chromiumExecutablePath.startsWith('/') && !chromiumExecutablePath.includes('chromium')) {
            console.warn('[Puppeteer] Chromium executablePath 경로 형식이 예상과 다릅니다:', chromiumExecutablePath);
          }
        } else if (typeof chromium.executablePath === 'string') {
          chromiumExecutablePath = chromium.executablePath;
          console.log('[Puppeteer] Chromium executablePath (문자열):', chromiumExecutablePath);
        } else {
          // executablePath가 없는 경우, chromium 객체에서 직접 찾기 시도
          console.error('[Puppeteer] executablePath를 찾을 수 없음. Chromium 객체 구조:', {
            keys: Object.keys(chromium),
            hasExecutablePath: 'executablePath' in chromium,
            executablePathType: typeof chromium.executablePath,
          });
          throw new Error('Chromium executablePath를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('[Puppeteer] Chromium executablePath 가져오기 실패:', error);
        console.error('[Puppeteer] Chromium 객체 전체 구조:', {
          hasExecutablePath: 'executablePath' in chromium,
          executablePathType: typeof chromium.executablePath,
          chromiumKeys: Object.keys(chromium).slice(0, 20),
          chromiumModuleType: typeof chromiumModule,
          chromiumModuleKeys: Object.keys(chromiumModule).slice(0, 10),
        });
        throw new Error(`Chromium executablePath 설정 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // setGraphicsMode 제거됨 - 크롤링에 필수가 아니며 최신 버전에서 에러 발생 가능
      // 크롤링 작업에는 GPU 가속이 필요하지 않으므로 생략해도 문제 없음
      // 메모리 최적화는 chromium.args에 이미 '--disable-gpu' 등이 포함되어 처리됨
      
      if (!chromiumExecutablePath) {
        throw new Error('Chromium executablePath가 비어있습니다.');
      }
      
      const chromiumHeadless = chromium.headless !== undefined ? chromium.headless : true;
      
      console.log('[Puppeteer] 브라우저 실행 옵션:', {
        argsCount: chromiumArgs.length,
        viewport: chromiumViewport,
        headless: chromiumHeadless,
        executablePathExists: !!chromiumExecutablePath,
      });
      
      // launch 옵션 설정
      // GitHub 이슈 #5662 해결 방법 적용:
      // - executablePath 명시적 설정
      // - 서버리스 환경에 맞는 args 추가
      // - ENOEXEC/ENOENT 에러 방지
      try {
        console.log('[Puppeteer] 브라우저 실행 시도:', {
          executablePath: chromiumExecutablePath?.substring(0, 100),
          argsCount: chromiumArgs.length + 7,
        });
        
        browser = await puppeteerCore.default.launch({
          args: [
            ...chromiumArgs,
            '--hide-scrollbars',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process', // Vercel 환경에서 안정성을 위해 추가
          ],
          defaultViewport: chromiumViewport,
          executablePath: chromiumExecutablePath,
          headless: chromiumHeadless,
          // ignoreDefaultArgs: true, // 기본 args 무시 (필요시 주석 해제)
        });
        
        console.log('[Puppeteer] 브라우저 실행 성공');
      } catch (launchError) {
        console.error('[Puppeteer] 브라우저 실행 실패:', launchError);
        console.error('[Puppeteer] 실행 파일 경로:', chromiumExecutablePath);
        console.error('[Puppeteer] 실행 파일 경로 존재 여부 확인 필요');
        
        // ENOEXEC/ENOENT 에러인 경우 더 자세한 정보 제공
        if (launchError instanceof Error) {
          if (launchError.message.includes('ENOEXEC') || launchError.message.includes('ENOENT')) {
            throw new Error(
              `Chromium 실행 파일을 찾을 수 없습니다. ` +
              `경로: ${chromiumExecutablePath}. ` +
              `@sparticuz/chromium 패키지가 올바르게 설치되었는지 확인하세요. ` +
              `GitHub 이슈 참고: https://github.com/puppeteer/puppeteer/issues/5662`
            );
          }
        }
        throw launchError;
      }
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

