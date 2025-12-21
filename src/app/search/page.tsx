import { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageClient } from '@/features/search/ui/SearchPage';
import { getAllPosts } from '@/entities/post/api';

// Post API 어댑터 초기화
import '@/app/init-post-api';

export const metadata: Metadata = {
  title: '검색',
  description: '블로그 포스트를 검색해보세요',
};

export default async function SearchPageComponent() {
  const posts = await getAllPosts();

  return (
    <Suspense fallback={<div className="animate-pulse">로딩 중...</div>}>
      <SearchPageClient initialPosts={posts} />
    </Suspense>
  );
}