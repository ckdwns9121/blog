interface VideoBlockProps {
  url?: string;
  caption?: string;
}

/**
 * 동영상 URL을 임베드 URL로 변환
 */
function getVideoEmbedUrl(url: string): { embedUrl: string; platform: string } | null {
  // YouTube
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        platform: "youtube",
      };
    }
  }

  // Vimeo
  const vimeoPatterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        platform: "vimeo",
      };
    }
  }

  // Loom
  const loomPattern = /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([^?]+)/;
  const loomMatch = url.match(loomPattern);
  if (loomMatch) {
    return {
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      platform: "loom",
    };
  }

  return null;
}

export function VideoBlock({ url, caption }: VideoBlockProps) {
  if (!url) return null;

  // 임베드 URL 확인
  const videoData = getVideoEmbedUrl(url);

  if (videoData) {
    // YouTube, Vimeo, Loom 등 임베드
    return (
      <figure className="my-8">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={videoData.embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={caption || "Video"}
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
        )}
      </figure>
    );
  }

  // 일반 비디오 파일 (.mp4, .webm, .ogg 등)
  return (
    <figure className="my-8">
      <video src={url} controls className="w-full h-auto rounded-lg shadow-lg">
        Your browser does not support the video tag.
      </video>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
}
