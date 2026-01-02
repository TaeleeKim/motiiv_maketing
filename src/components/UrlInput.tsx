'use client';

import { useState } from 'react';

interface UrlInputProps {
  onSubmit: (urls: string[], options: { targetAudience: string; language: string; searchFilter: string[] }) => void;
  loading: boolean;
}

type FilterOption = 'reddit' | 'quora' | 'linkedin' | 'engineer_forum' | 'medium' | 'velog' | 'tistory' | 'naver' | 'brunch' | 'daum';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'quora', label: 'Quora' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'engineer_forum', label: '엔지니어 전문 포럼' },
  { value: 'medium', label: 'Medium' },
  { value: 'velog', label: 'Velog' },
  { value: 'tistory', label: 'Tistory' },
  { value: 'naver', label: 'Naver (블로그 + 카페)' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'daum', label: 'Daum' },
];

export default function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [urlText, setUrlText] = useState('');
  const [targetAudience, setTargetAudience] = useState('구조/토목 엔지니어');
  const [language, setLanguage] = useState('both');
  const [searchFilters, setSearchFilters] = useState<FilterOption[]>(['reddit']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const urls = urlText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.startsWith('http'));

    if (urls.length === 0) {
      alert('유효한 URL을 입력해주세요.');
      return;
    }

    if (searchFilters.length === 0) {
      alert('최소 하나의 검색 대상을 선택해주세요.');
      return;
    }

    onSubmit(urls, { targetAudience, language, searchFilter: searchFilters });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">URL 입력</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분석할 URL (한 줄에 하나씩)
          </label>
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/article1&#10;https://example.com/article2"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            타겟 독자
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키워드 언어
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="both">한국어 + 영어</option>
            <option value="ko">한국어만</option>
            <option value="en">영어만</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            검색 대상 (여러 개 선택 가능, 각 필터당 5개 결과)
          </label>
          <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
            {FILTER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchFilters.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSearchFilters([...searchFilters, option.value]);
                    } else {
                      setSearchFilters(searchFilters.filter((f) => f !== option.value));
                    }
                  }}
                  disabled={loading}
                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {searchFilters.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              선택됨: {searchFilters.length}개 (예상 결과: {searchFilters.length * 5}개)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '처리 중...' : '분석 시작'}
        </button>
      </form>
    </div>
  );
}

