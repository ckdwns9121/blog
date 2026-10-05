import Link from 'next/link';
import { HeaderPlugin } from '../types';

/**
 * 헤더 로고. 캐리커처 선화를 벡터(/logo-mark.svg)로 추적한 것이라 어떤 크기에서도 또렷하다.
 *
 * <img> 로 넣으면 SVG 안의 currentColor 가 페이지 글자색을 읽지 못해 다크 모드에서 검은 선이
 * 그대로 남는다. 그래서 SVG 를 CSS mask 로 쓰고 배경을 currentColor 로 칠한다. 글자색이
 * 바뀌면(다크 모드, 호버) 로고 선 색도 같이 바뀐다.
 */
export function createLogoPlugin(): HeaderPlugin {
  return {
    id: 'logo',
    name: '로고',
    position: 'left',
    priority: 20, // 가장 높은 우선순위
    render: () => (
      <div className="hidden md:flex items-center">
        <Link href="/" className="flex items-center text-fg hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="홈으로 이동">
          <span
            role="img"
            aria-label="박창준 블로그 로고"
            className="block h-10 w-10 bg-current [mask-image:url(/logo-mark.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
          />
        </Link>
      </div>
    ),
  };
}
