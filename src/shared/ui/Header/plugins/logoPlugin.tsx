import Link from 'next/link';
import { HeaderPlugin } from '../types';

/**
 * 헤더 로고. 캐리커처 선화를 벡터(/logo-mark.svg)로 추적한 것이라 어떤 크기에서도 또렷하다.
 *
 * 다크 모드에서도 라이트 모드와 똑같이 "흰 바탕에 검은 선"으로 보이게 한다. 선 색을 글자색에
 * 따라가게 하면 다크 모드에서 머리카락이 희게, 얼굴이 검게 반전되어 전혀 다른 그림이 된다.
 * 그래서 흰 원형 배지 위에 SVG 를 CSS mask 로 뜨고 고정된 검정으로 칠한다. 라이트 모드에서는
 * 흰 원이 배경과 같아 선화만 보이고, 다크 모드에서는 흰 배지로 보인다.
 */
export function createLogoPlugin(): HeaderPlugin {
  return {
    id: 'logo',
    name: '로고',
    position: 'left',
    priority: 20, // 가장 높은 우선순위
    render: () => (
      <div className="hidden md:flex items-center">
        <Link href="/" className="flex items-center rounded-full transition-opacity hover:opacity-80" aria-label="홈으로 이동">
          <span
            role="img"
            aria-label="박창준 블로그 로고"
            className="block h-10 w-10 overflow-hidden rounded-full bg-white"
          >
            <span className="block h-full w-full bg-[#16181a] [mask-image:url(/logo-mark.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]" />
          </span>
        </Link>
      </div>
    ),
  };
}
