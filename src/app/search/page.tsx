import { redirect } from 'next/navigation';

export const metadata = {
  title: '검색',
  description: '블로그 포스트를 검색해보세요',
};

export default function SearchPage() {
  redirect('/');
}