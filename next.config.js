/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone 모드: 독립 실행 가능한 빌드 생성
  output: 'standalone',
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

