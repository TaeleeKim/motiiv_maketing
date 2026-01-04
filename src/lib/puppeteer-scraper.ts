import { SEOInfo } from './scraper';

export async function scrapeUrlWithPuppeteer(url: string): Promise<{ title: string; content: string; seoInfo: SEOInfo }> {
  let browser: any;
  
  try {
    console.log('[Puppeteer] 브라우저 시작:', url);
    
    // Vercel 환경 감지
    // 로컬에서는 USE_VERCEL_CHROMIUM을 설정해도 실제 Vercel 환경이 아니면 일반 puppeteer 사용
    // 실제 Vercel 배포 환경에서만 @sparticuz/chromium 사용
    const isVercel = !!process.env.VERCEL;
    
    // Vercel 환경에서는 @sparticuz/chromium-min + puppeteer-core 사용
    // Vercel 공식 문서 권장: https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel
    if (isVercel) {
      console.log('[Puppeteer] Vercel 환경 감지, @sparticuz/chromium-min 사용');
      const chromiumModule = await import('@sparticuz/chromium-min');
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
      // chromium-min은 Vercel 환경에 최적화된 경량 버전
      const chromiumArgs = Array.isArray(chromium.args) ? chromium.args : [];
      const chromiumViewport = chromium.defaultViewport || { width: 1280, height: 720 };
      
      // executablePath 가져오기
      // chromium-min은 런타임에 호스팅된 tar 파일에서 Chromium 바이너리를 다운로드
      // Vercel 배포 가이드: Build Time에 chromium이 public/chromium-pack.tar 생성
      // Runtime에 chromium-min이 다운로드 및 추출
      let chromiumExecutablePath: string;
      try {
        // chromium-min의 executablePath()는 자동으로 다운로드 및 추출을 처리
        // 첫 호출 시 다운로드, 이후 호출은 캐시된 경로 반환
        if (typeof chromium.executablePath === 'function') {
          // chromium-min은 자동으로 GitHub releases에서 다운로드하거나
          // public/chromium-pack.tar를 사용할 수 있음
          chromiumExecutablePath = await chromium.executablePath();
          console.log('[Puppeteer] Chromium executablePath (함수, 다운로드 완료):', chromiumExecutablePath?.substring(0, 100));
          
          // 경로가 유효한지 확인
          if (!chromiumExecutablePath || chromiumExecutablePath.trim() === '') {
            throw new Error('Chromium executablePath가 비어있습니다.');
          }
        } else if (typeof chromium.executablePath === 'string') {
          chromiumExecutablePath = chromium.executablePath;
          console.log('[Puppeteer] Chromium executablePath (문자열):', chromiumExecutablePath?.substring(0, 100));
        } else {
          // executablePath가 없는 경우
          console.error('[Puppeteer] executablePath를 찾을 수 없음. Chromium 객체 구조:', {
            keys: Object.keys(chromium),
            hasExecutablePath: 'executablePath' in chromium,
            executablePathType: typeof chromium.executablePath,
          });
          throw new Error('Chromium executablePath를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('[Puppeteer] Chromium executablePath 가져오기 실패:', error);
        console.error('[Puppeteer] Chromium 객체 구조:', {
          hasExecutablePath: 'executablePath' in chromium,
          executablePathType: typeof chromium.executablePath,
          chromiumKeys: Object.keys(chromium).slice(0, 20),
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
      // libnss3.so 에러 해결: chromium.args에 이미 필요한 모든 옵션이 포함되어 있음
      // 추가 args는 중복을 피하고 필요한 것만 추가
      try {
        // chromium.args에 이미 포함된 옵션 확인
        const existingArgs = new Set(chromiumArgs);
        
        // 추가로 필요한 args만 추가 (중복 방지)
        const additionalArgs: string[] = [];
        if (!existingArgs.has('--hide-scrollbars')) {
          additionalArgs.push('--hide-scrollbars');
        }
        if (!existingArgs.has('--disable-web-security')) {
          additionalArgs.push('--disable-web-security');
        }
        
        // chromium.args를 먼저 사용 (시스템 라이브러리 문제 해결을 위한 옵션 포함)
        const launchArgs = [...chromiumArgs, ...additionalArgs];
        
        console.log('[Puppeteer] 브라우저 실행 시도:', {
          executablePath: chromiumExecutablePath?.substring(0, 100),
          argsCount: launchArgs.length,
          chromiumArgsCount: chromiumArgs.length,
          additionalArgsCount: additionalArgs.length,
        });
        
        browser = await puppeteerCore.default.launch({
          args: launchArgs,
          defaultViewport: chromiumViewport,
          executablePath: chromiumExecutablePath,
          headless: chromiumHeadless,
        });
        
        console.log('[Puppeteer] 브라우저 실행 성공');
      } catch (launchError) {
        console.error('[Puppeteer] 브라우저 실행 실패:', launchError);
        console.error('[Puppeteer] 실행 파일 경로:', chromiumExecutablePath);
        console.error('[Puppeteer] 실행 파일 경로 존재 여부 확인 필요');
        
        // 다양한 에러 타입에 대한 처리
        if (launchError instanceof Error) {
          const errorMessage = launchError.message;
          
          // ENOEXEC/ENOENT 에러
          if (errorMessage.includes('ENOEXEC') || errorMessage.includes('ENOENT')) {
            throw new Error(
              `Chromium 실행 파일을 찾을 수 없습니다. ` +
              `경로: ${chromiumExecutablePath}. ` +
              `@sparticuz/chromium 패키지가 올바르게 설치되었는지 확인하세요. ` +
              `GitHub 이슈 참고: https://github.com/puppeteer/puppeteer/issues/5662`
            );
          }
          
          // libnss3.so 등 공유 라이브러리 에러
          if (errorMessage.includes('libnss3.so') || 
              errorMessage.includes('cannot open shared object file') ||
              errorMessage.includes('shared libraries')) {
            throw new Error(
              `Chromium 실행에 필요한 시스템 라이브러리를 찾을 수 없습니다. ` +
              `에러: ${errorMessage}. ` +
              `@sparticuz/chromium-min은 Vercel 환경에 최적화되어 있으며 필요한 라이브러리를 포함해야 합니다. ` +
              `Vercel 공식 문서 참고: https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel`
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

