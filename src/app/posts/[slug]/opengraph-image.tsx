import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/features/notion';

export const runtime = 'edge';
export const alt = 'Blog Post';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await getPostBySlug(slug);

    // 제목과 날짜로 OG 이미지 생성
    const formattedDate = new Date(post.publishedAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '1000px',
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'black',
                textAlign: 'center',
                marginBottom: '40px',
                lineHeight: '1.2',
                wordBreak: 'break-word',
              }}
            >
              {post.title}
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: 'black',
                textAlign: 'center',
                marginTop: '20px',
              }}
            >
              {formattedDate}
            </p>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch {
    // 에러 발생 시 기본 이미지 반환
    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: '48px', color: 'black' }}>포스트를 찾을 수 없습니다</p>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}

