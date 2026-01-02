export interface CommentDraft {
  language: 'ko' | 'en' | 'both';
  text: string;
}

export interface AnalysisResult {
  url: string;
  title: string;
  summary: string;
  keywords: string[];
  relatedPages: RelatedPage[];
  commentDrafts?: CommentDraft[];
}

export interface RelatedPage {
  title: string;
  url: string;
  snippet: string;
  source: string;
  filter?: string;
  trackingUrl?: string;
}

export interface ProcessRequest {
  urls: string[];
  targetAudience?: string;
  language?: 'ko' | 'en' | 'both';
  searchFilter?: ('all' | 'reddit' | 'quora' | 'linkedin' | 'engineer_forum' | 'medium' | 'velog' | 'tistory' | 'naver' | 'brunch' | 'daum')[];
}

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  error?: string;
}

export interface AnalyzeResult {
  summary: string;
  keywords: string[];
  commentDrafts: CommentDraft[];
}

