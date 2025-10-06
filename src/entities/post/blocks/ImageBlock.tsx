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
      <div className="relative w-full aspect-[16/9]">
        <Image src={url} alt={caption || ""} fill className="rounded-lg object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
