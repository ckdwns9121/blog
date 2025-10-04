# 성능 최적화 아키텍처

## SSG 최적화 전략

```typescript
// app/posts/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await notionClient.getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await notionClient.getPostBySlug(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}
```

## 이미지 최적화

```typescript
// components/OptimizedImage.tsx
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({ src, alt, width, height }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 400}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

## 코드 스플리팅 전략

```typescript
// 동적 임포트를 통한 코드 스플리팅
const CodeHighlight = dynamic(() => import("./CodeHighlight"), {
  loading: () => <div>Loading...</div>,
});

const SearchComponent = dynamic(() => import("./SearchComponent"), {
  ssr: false, // 클라이언트 사이드에서만 렌더링
});
```
