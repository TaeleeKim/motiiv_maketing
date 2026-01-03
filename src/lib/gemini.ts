import { GoogleGenAI } from '@google/genai';
import { SEOInfo } from './scraper';

export interface AnalyzeOptions {
  title: string;
  content: string;
  targetAudience?: string;
  language?: 'ko' | 'en' | 'both';
  seoInfo?: SEOInfo;
}

export async function analyzeContent(options: AnalyzeOptions) {
  const {
    title,
    content,
    targetAudience = '구조/토목 엔지니어',
    language = 'both',
    seoInfo,
  } = options;

  const languageInstruction =
    language === 'ko'
      ? '한국어로만'
      : language === 'en'
      ? '영어로만'
      : '한국어와 영어를 혼합하여';

  // 👇 크롤링한 전체 내용을 사용 (너무 길면 여기서 잘라주는 로직 추가 가능)
  const effectiveContent = content;

  // SEO 정보를 키워드 보강에 활용
  let seoContext = '';
  if (seoInfo) {
    const seoParts: string[] = [];
    
    if (seoInfo.description) {
      seoParts.push(`메타 설명: ${seoInfo.description}`);
    }
    
    if (seoInfo.keywords && seoInfo.keywords.length > 0) {
      seoParts.push(`메타 키워드: ${seoInfo.keywords.join(', ')}`);
    }
    
    if (seoInfo.ogTitle) {
      seoParts.push(`OG 제목: ${seoInfo.ogTitle}`);
    }
    
    if (seoInfo.ogDescription) {
      seoParts.push(`OG 설명: ${seoInfo.ogDescription}`);
    }
    
    if (seoInfo.ogKeywords) {
      seoParts.push(`OG 키워드: ${seoInfo.ogKeywords}`);
    }
    
    if (seoParts.length > 0) {
      seoContext = `\n\nSEO 정보:\n${seoParts.join('\n')}\n\n위 SEO 정보를 참고하여 키워드를 보강하세요.`;
    }
  }

  // 언어별 댓글 초안 생성 요청
  let commentDraftInstruction = '';
  if (language === 'ko') {
    commentDraftInstruction = '한국어로만 작성된 커뮤니티 댓글 초안 1개 (2-3문장, 광고X, 자연스럽게)';
  } else if (language === 'en') {
    commentDraftInstruction = '영어로만 작성된 커뮤니티 댓글 초안 1개 (2-3문장, 광고X, 자연스럽게)';
  } else {
    commentDraftInstruction = '다음 2가지 버전의 커뮤니티 댓글 초안을 각각 작성 (각 2-3문장, 광고X, 자연스럽게):\n- 한국어 버전 1개\n- 영어 버전 1개';
  }

  const prompt = `제목: ${title}
내용:
${effectiveContent}${seoContext}

${targetAudience} 관점에서:
1. 요약 (3문장)
2. 키워드 5개 (${languageInstruction}, SEO 정보를 참고하여 보강)
3. ${commentDraftInstruction}


JSON만 정확히 출력:
${language === 'both' 
  ? '{"summary":"...","keywords":["..."],"commentDraftKo":"...","commentDraftEn":"..."}'
  : '{"summary":"...","keywords":["..."],"commentDraft":"..."}'}
위 JSON 형식만 출력하고, 그 외 텍스트/마크다운/코드블록은 절대 넣지 마.`;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  try {
    console.log('[Gemini] API 호출 시작 - 입력 길이:', prompt.length, '자');

    // ✅ 새 SDK 초기화
    const ai = new GoogleGenAI({
      apiKey,
      // vertexai: false // 기본값이라 생략해도 됨 (AI Studio 키 쓰는 경우)
    });

    const modelName = 'gemini-2.5-flash'; // 현재 지원되는 텍스트용 모델

    // 언어에 따라 출력 토큰 수 조정
    // 한국어는 영어보다 토큰을 더 많이 사용하므로 더 많은 토큰 할당
    // both: 한국어+영어 2개 버전, ko: 한국어만, en: 영어만
    const maxOutputTokens = 
      language === 'both' ? 2048 :  // 한국어+영어 2개 버전
      language === 'ko' ? 1536 :    // 한국어는 토큰을 더 많이 사용
      1024;                          // 영어는 상대적으로 적음

    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        // ✅ 새 SDK 스타일: ai.models.generateContent
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: maxOutputTokens,
            topP: 0.95,
          },
        });
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        // 429 (쿼터) 대응
        if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
          retries++;
          if (retries >= maxRetries) {
            throw new Error(
              'Gemini API 할당량 초과. 잠시 후 다시 시도하세요. (1분 후)',
            );
          }
          console.log(
            `[Gemini] 할당량 초과, ${10 * retries}초 후 재시도 (${retries}/${maxRetries})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 10_000 * retries),
          );
        } else if (msg.includes('404') && msg.includes('models/')) {
          // 모델 이름 문제일 때
          throw new Error(
            `Gemini 모델을 찾을 수 없습니다. 모델 이름을 다시 확인하세요. (지금은 '${modelName}' 사용 중 – ai.google.dev 모델 리스트 참고)`,
          );
        } else {
          throw err;
        }
      }
    }

    if (!response) {
      throw new Error('콘텐츠 생성에 실패했습니다.');
    }

    // ✅ 새 SDK: text는 getter 프로퍼티
    const textResponse = response.text ?? '';

    console.log('[Gemini] API 응답 성공 - 출력 길이:', textResponse.length, '자');

    if (!textResponse) {
      throw new Error('Gemini API 응답이 비어 있습니다.');
    }

    // JSON 추출: ```json 코드 블록 제거 및 JSON 파싱
    let jsonText = textResponse.trim();
    
    // ```json ... ``` 형식 제거
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    
    // 중괄호로 시작하는 JSON 객체만 추출
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    jsonText = jsonText.trim();
    
    console.log('[Gemini] JSON 추출 완료 - 길이:', jsonText.length, '자');
    console.log('[Gemini] JSON 미리보기:', jsonText.substring(0, 200));

    // JSON이 잘렸는지 확인 (닫는 중괄호가 있는지)
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.warn(`[Gemini] JSON이 잘렸을 수 있습니다. 열린 중괄호: ${openBraces}, 닫힌 중괄호: ${closeBraces}`);
      console.error('[Gemini] 잘린 JSON 응답:', jsonText);
      throw new Error('Gemini API 응답이 잘렸습니다. maxOutputTokens를 늘려주세요.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Gemini] JSON 파싱 실패 - 원본 응답:', textResponse);
      console.error('[Gemini] JSON 파싱 실패 - 추출된 JSON:', jsonText);
      
      // JSON이 잘렸는지 추가 확인
      if (parseError instanceof SyntaxError && parseError.message.includes('Unterminated')) {
        throw new Error('Gemini API 응답이 잘렸습니다. 출력 토큰 수를 늘려주세요.');
      }
      
      throw new Error(`JSON 파싱 실패: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // 언어별 댓글 초안 배열 생성
    const commentDrafts: Array<{ language: 'ko' | 'en' | 'both'; text: string }> = [];
    
    if (language === 'ko') {
      if (parsedResult.commentDraft) {
        commentDrafts.push({ language: 'ko', text: parsedResult.commentDraft });
      }
    } else if (language === 'en') {
      if (parsedResult.commentDraft) {
        commentDrafts.push({ language: 'en', text: parsedResult.commentDraft });
      }
    } else {
      // both: 한국어 버전과 영어 버전 2개만
      if (parsedResult.commentDraftKo) {
        commentDrafts.push({ language: 'ko', text: parsedResult.commentDraftKo });
      }
      if (parsedResult.commentDraftEn) {
        commentDrafts.push({ language: 'en', text: parsedResult.commentDraftEn });
      }
    }

    return {
      summary: parsedResult.summary || '',
      keywords: parsedResult.keywords || [],
      commentDrafts: commentDrafts,
    };
  } catch (error) {
    console.error('[Gemini] 처리 오류:', error);

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('429') || msg.includes('quota')) {
        throw new Error(
          'Gemini API 무료 할당량을 초과했습니다. 1분 후 다시 시도하거나 URL 개수를 줄여주세요.',
        );
      }
      throw new Error(`콘텐츠 분석에 실패했습니다: ${error.message}`);
    }

    throw new Error('콘텐츠 분석에 실패했습니다: 알 수 없는 오류');
  }
}