"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageBlock } from "./ImageBlock";
import { Modal } from "@/shared/ui";
import { getOptimizedImageData } from "@/shared/utils/imageMapper";

interface ImageWithModalProps {
  url?: string;
  caption?: string;
}

/**
 * 이미지와 모달을 조합한 컴포넌트
 * 모달 상태 관리를 담당
 */
export function ImageWithModal({ url, caption }: ImageWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!url) return null;

  const optimizedImage = getOptimizedImageData(url);
  const isGif = optimizedImage.src.endsWith(".gif");

  return (
    <>
      <ImageBlock url={url} caption={caption} enableModal={true} onImageClick={() => setIsModalOpen(true)} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* 이미지 */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={optimizedImage.src}
            alt={caption || ""}
            width={optimizedImage.width || 0}
            height={optimizedImage.height || 0}
            sizes="100vw"
            className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg object-contain"
            unoptimized={isGif}
          />
        </div>

        {/* 캡션 */}
        {caption && (
          <div className="mt-4 text-center text-sm text-white bg-black/50 rounded-lg px-4 py-2">{caption}</div>
        )}
      </Modal>
    </>
  );
}
