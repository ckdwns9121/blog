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
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{`<Changjun.blog/>`}</span>
        </Link>
      </div>
    ),
  };
}