interface VideoBlockProps {
  url?: string;
  caption?: string;
}

/**
 * 비디오 플랫폼 설정
 */
interface VideoPlatformConfig {
  platform: string;
  patterns: RegExp[];
  embedUrl: (id: string) => string;
}

const VIDEO_PLATFORMS: VideoPlatformConfig[] = [
  {
    platform: "youtube",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    ],
    embedUrl: (id: string) => `https://www.youtube.com/embed/${id}`,
  },
  {
    platform: "vimeo",
    patterns: [/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/, /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/],
    embedUrl: (id: string) => `https://player.vimeo.com/video/${id}`,
  },
  {
    platform: "loom",
    patterns: [/(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([^?]+)/],
    embedUrl: (id: string) => `https://www.loom.com/embed/${id}`,
  },
  // 새로운 플랫폼 추가 시 여기에 추가하면 됨
  // {
  //   platform: "dailymotion",
  //   patterns: [/(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([^_]+)/],
  //   embedUrl: (id: string) => `https://www.dailymotion.com/embed/video/${id}`,
  // },
];

/**
 * 동영상 URL을 임베드 URL로 변환
 */
function getVideoEmbedUrl(url: string): { embedUrl: string; platform: string } | null {
  for (const { platform, patterns, embedUrl } of VIDEO_PLATFORMS) {
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return {
          embedUrl: embedUrl(match[1]),
          platform,
        };
      }
    }
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
