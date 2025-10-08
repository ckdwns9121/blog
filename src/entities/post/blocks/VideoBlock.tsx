interface VideoBlockProps {
  url?: string;
  caption?: string;
}

/**
 * YouTube URL을 임베드 URL로 변환
 */
function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

export function VideoBlock({ url, caption }: VideoBlockProps) {
  if (!url) return null;

  // YouTube URL 확인
  const embedUrl = getYouTubeEmbedUrl(url);

  if (embedUrl) {
    // YouTube 임베드
    return (
      <figure className="my-8">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
        )}
      </figure>
    );
  }

  // 일반 비디오 파일
  return (
    <figure className="my-8">
      <video src={url} controls className="w-full h-auto rounded-lg">
        Your browser does not support the video tag.
      </video>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
