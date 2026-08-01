import Image from "next/image";
import { resolvePostImage } from "@/shared/lib/postImage";
import { getPostContentThumbnail } from "@/shared/utils/postThumbnail";

interface PostThumbnailProps {
  slug: string;
  title: string;
  coverImage?: string;
  className?: string;
}

/**
 * 폴백 썸네일에 쓸 글자.
 * 한글은 한 글자, 영문은 두 글자여야 균형이 맞는다.
 */
function getMonogram(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "#";

  const firstChar = [...trimmed][0];
  const isCjk = /[぀-ヿ一-鿿가-힯]/.test(firstChar);

  return isCjk ? firstChar : [...trimmed].slice(0, 2).join("").toUpperCase();
}

/**
 * 이미지가 하나도 없는 글도 목록에서 빈칸으로 보이지 않게 하는 폴백.
 *
 * 동적 OG 이미지(/posts/[slug]/opengraph-image)를 그대로 쓰지 않는 이유는,
 * 그쪽은 1200x630 PNG를 edge에서 생성하는 경로라 목록 한 페이지에 20장을
 * 띄우면 비용이 과하기 때문이다. 카드에서는 같은 톤의 CSS 썸네일로 대체한다.
 */
function FallbackThumbnail({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="from-primary-100 to-primary-300 dark:from-primary-950 dark:to-primary-800 flex h-full w-full items-center justify-center bg-gradient-to-br"
    >
      <span className="text-primary-700/60 dark:text-primary-200/50 text-2xl font-bold select-none">
        {getMonogram(title)}
      </span>
    </div>
  );
}

export function PostThumbnail({ slug, title, coverImage, className }: PostThumbnailProps) {
  const { src, source } = resolvePostImage({
    coverImage,
    contentImage: getPostContentThumbnail(slug),
    slug,
  });

  return (
    <div className={`bg-surface-raised relative shrink-0 overflow-hidden ${className ?? ""}`}>
      {source === "generated" ? (
        <FallbackThumbnail title={title} />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 96px, 128px"
          className="object-cover"
          // 변환되지 않은 외부 URL이 남아 있을 수 있어, 원격 이미지는 최적화를 건너뛴다.
          unoptimized={!src.startsWith("/")}
        />
      )}
    </div>
  );
}
