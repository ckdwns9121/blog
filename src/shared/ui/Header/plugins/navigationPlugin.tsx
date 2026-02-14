import Link from 'next/link';
import { HeaderPlugin } from '../types';

export function createNavigationPlugin(): HeaderPlugin {
  return {
    id: 'navigation',
    name: '네비게이션',
    position: 'center',
    priority: 10,
    render: () => (
      <nav aria-label="주요 네비게이션" className="hidden md:flex items-center space-x-8">
        <Link
          href="/"
          className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
        >
          Post
        </Link>
        <Link
          href="/about"
          className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
        >
          About
        </Link>
      </nav>
    ),
  };
}
