import Image from "next/image";
import { getOptimizedImageUrl } from "@/shared/utils/imageMapper";

interface ImageBlockProps {
  url?: string;
  caption?: string;
  enableModal?: boolean; // 모달 사용 여부
  onImageClick?: () => void; // 이미지 클릭 핸들러
}

/**
 * 이미지 블록을 렌더링하는 컴포넌트
 * 빌드 시점에 WebP로 변환된 로컬 이미지를 사용
 * 순수하게 이미지 렌더링만 담당
 */
export function ImageBlock({ url, caption, enableModal = false, onImageClick }: ImageBlockProps) {
  if (!url) return null;

  // 빌드 시점에 변환된 로컬 이미지 경로 가져오기
  const optimizedImageUrl = getOptimizedImageUrl(url);

  // GIF는 Next.js 이미지 최적화를 비활성화하여 애니메이션 보존
  const isGif = optimizedImageUrl.endsWith(".gif");

  return (
    <figure className="my-6">
      <Image
        src={optimizedImageUrl}
        alt={caption || ""}
        width={0}
        height={0}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
        className={`w-full max-w-3xl h-auto rounded-lg mx-auto block ${enableModal && onImageClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
        onClick={onImageClick}
        unoptimized={isGif}
      />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
