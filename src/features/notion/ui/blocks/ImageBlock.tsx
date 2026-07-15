import Image from "next/image";
import { getOptimizedImageData } from "@/shared/utils/imageMapper";

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
  const optimizedImage = getOptimizedImageData(url);

  // GIF는 Next.js 이미지 최적화를 비활성화하여 애니메이션 보존
  const isGif = optimizedImage.src.endsWith(".gif");
  const isInteractive = enableModal && onImageClick;

  const image = (
    <Image
      src={optimizedImage.src}
      alt={caption || ""}
      width={optimizedImage.width || 0}
      height={optimizedImage.height || 0}
      sizes="(max-width: 640px) calc(100vw - 2rem), 960px"
      className={`block h-auto rounded-lg mx-auto ${optimizedImage.width ? "w-auto max-w-full" : "w-full"}`}
      unoptimized={isGif}
    />
  );

  return (
    <figure className="my-6">
      {isInteractive ? (
        <button
          type="button"
          onClick={onImageClick}
          className="block max-w-full rounded-lg mx-auto cursor-pointer hover:opacity-90 transition-opacity"
          aria-label={caption ? `${caption} 크게 보기` : "이미지 크게 보기"}
        >
          {image}
        </button>
      ) : (
        <div className="max-w-full mx-auto">{image}</div>
      )}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
