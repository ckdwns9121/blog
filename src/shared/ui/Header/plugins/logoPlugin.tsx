import Image from 'next/image';
import Link from 'next/link';
import { HeaderPlugin } from '../types';

export function createLogoPlugin(): HeaderPlugin {
  return {
    id: 'logo',
    name: '로고',
    position: 'left',
    priority: 20, // 가장 높은 우선순위
    render: () => (
      <div className="hidden md:flex items-center">
        <Link href="/" className="flex items-center" aria-label="홈으로 이동">
          {/* logo.png 는 머리와 어깨가 다 들어간 OG 이미지용 구도라 32px 로 줄이면 얼굴이 너무 작다.
              헤더에는 얼굴만 자른 160px 마크를 40px 원형으로 쓴다. 선화는 WebP 재압축에서 뭉개지므로
              3KB 짜리 PNG 를 그대로 내보낸다(unoptimized). 2x 화면에서도 80px 원본이 있어 또렷하다. */}
          <Image
            src="/logo-mark.png"
            alt="박창준 블로그 로고"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
            unoptimized
          />
        </Link>
      </div>
    ),
  };
}
