import React from "react";
import Image from "next/image";

interface ImageBlockProps {
  url?: string;
  caption?: string;
}

/**
 * 이미지 블록을 렌더링하는 컴포넌트
 */
export function ImageBlock({ url, caption }: ImageBlockProps) {
  if (!url) return null;

  return (
    <figure className="mb-6">
      <Image src={url} alt={caption || ""} className="w-full rounded-lg" />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
