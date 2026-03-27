import { Preset } from '../types';

export const PRESETS: Preset[] = [
  {
    id: 'meat-restaurant',
    emoji: '🥩',
    label: '고기집 신규 오픈 기획',
    topic: '신규 고기집(정육식당/구이전문점) 오픈 전략을 수립해주세요.',
    context_placeholder:
      '지역: (예: 울산 남구)\n예산: (예: 5000만원)\n컨셉: (예: 점심 배달 + 저녁 구이 하이브리드)\n목표: (예: 원가율 35% 이하, 월 매출 3000만원)',
  },
  {
    id: 'sales-boost',
    emoji: '🏪',
    label: '기존 매장 매출 개선',
    topic: '현재 운영 중인 매장의 매출을 개선할 전략을 수립해주세요.',
    context_placeholder:
      '업종: (예: 한식당)\n현재 월매출: (예: 2000만원)\n문제점: (예: 저녁 시간대 공석 많음)\n목표: (예: 월매출 30% 상승)',
  },
  {
    id: 'delivery',
    emoji: '📦',
    label: '배달 전문점 런칭',
    topic: '배달 전문점 또는 기존 매장의 배달 메뉴 런칭 전략을 수립해주세요.',
    context_placeholder:
      '지역: \n메뉴 카테고리: (예: 한식, 분식, 치킨)\n배달앱: (예: 배민, 쿠팡이츠)\n예산: \n목표 일 주문수: ',
  },
  {
    id: 'marketing',
    emoji: '📈',
    label: '마케팅/브랜딩 전략',
    topic: '브랜드 인지도 향상 및 마케팅 전략을 수립해주세요.',
    context_placeholder:
      '브랜드명: \n업종: \n타겟 고객: \n현재 마케팅 채널: \n월 마케팅 예산: ',
  },
  {
    id: 'investment',
    emoji: '💰',
    label: '투자/자금 운용 전략',
    topic: '사업 투자 및 자금 운용 전략을 수립해주세요.',
    context_placeholder:
      '투자 가능 금액: \n투자 목적: (예: 신규 매장, 설비, 부동산)\n기간: \n리스크 허용도: (보수적/중립/공격적)',
  },
  {
    id: 'location',
    emoji: '🏠',
    label: '부동산/상권 분석',
    topic: '특정 지역의 상권을 분석하고 최적의 입지 전략을 수립해주세요.',
    context_placeholder:
      '후보 지역: \n업종: \n예산 (보증금+권리금): \n필요 면적: \n주요 타겟: ',
  },
];
