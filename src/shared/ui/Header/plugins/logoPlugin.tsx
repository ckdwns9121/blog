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
          <Image src="/logo.png" alt="박창준 블로그 로고" width={32} height={32} className="h-8 w-8 rounded-md object-cover" priority />
        </Link>
      </div>
    ),
  };
}
