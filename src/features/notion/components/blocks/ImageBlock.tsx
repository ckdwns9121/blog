import Image from "next/image";
import { getOptimizedImageUrl } from "@/shared/utils/imageMapper";

interface ImageBlockProps {
  url?: string;
  caption?: string;
}

/**
 * 이미지 블록을 렌더링하는 컴포넌트
 * 빌드 시점에 WebP로 변환된 로컬 이미지를 사용
 */
export function ImageBlock({ url, caption }: ImageBlockProps) {
  if (!url) return null;

  // 빌드 시점에 변환된 로컬 WebP 이미지 경로 가져오기
  const optimizedImageUrl = getOptimizedImageUrl(url);

  return (
    <figure className="my-8">
      <Image
        src={optimizedImageUrl}
        alt={caption || ""}
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto rounded-lg"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
