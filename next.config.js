/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone 모드: 독립 실행 가능한 빌드 생성 (Vercel에서는 무시됨)
  // Vercel은 자체 빌드 시스템을 사용하므로 이 설정은 로컬/다른 플랫폼용
  output: process.env.VERCEL ? undefined : 'standalone',
  // Vercel 환경에서 Puppeteer 관련 패키지 외부화
  // 이 설정은 Vercel 배포 시 필수입니다
  // Prevent Next.js from bundling these packages (they contain native binaries)
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  // 디버깅을 위한 소스맵 설정
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 개발 환경에서 더 나은 소스맵 제공
      config.devtool = isServer ? 'source-map' : 'eval-source-map';
    }
    return config;
  },
};

module.exports = nextConfig;

