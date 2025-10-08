import Image from "next/image";

interface ImageBlockProps {
  url?: string;
  caption?: string;
}

/**
 * 이미지 블록을 렌더링하는 컴포넌트
 * 원본 이미지 비율을 유지하면서 반응형으로 표시
 */
export function ImageBlock({ url, caption }: ImageBlockProps) {
  if (!url) return null;

  return (
    <figure className="my-8">
      <Image src={url} alt={caption || ""} width={0} height={0} sizes="100vw" className="w-full h-auto rounded-lg" />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
