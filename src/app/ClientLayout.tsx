'use client';

import { HeaderPlugin } from '@/shared/ui/Header/types';
import { BlogPost } from '@/entities/post/model';
import { Header } from '@/shared/ui/Header';
import {
  createLogoPlugin,
  createNavigationPlugin,
  createSearchPlugin,
  createMobileSearchPlugin,
  createThemeTogglePlugin,
} from '@/shared/ui/Header';

interface ClientLayoutProps {
  children: React.ReactNode;
  posts: BlogPost[];
}

export function ClientLayout({ children, posts }: ClientLayoutProps) {
  // 헤더 플러그인 생성
  const headerPlugins: HeaderPlugin[] = useMemo(() => [
    createLogoPlugin(),
    createNavigationPlugin(),
    createSearchPlugin(posts),
    createThemeTogglePlugin(),
  ], [posts]);

  // 모바일 전용 플러그인
  const mobileHeaderPlugins: HeaderPlugin[] = useMemo(() => [
    createMobileSearchPlugin(posts),
  ], [posts]);

  return (
    <>
      <Header plugins={headerPlugins} mobilePlugins={mobileHeaderPlugins} />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">{children}</main>
    </>
  );
}