import fs from "fs";
import path from "path";
import type { OptimizedImage } from "./convertImages";
import type { PostBuildData } from "./postBuildData";

/**
 * 목록 카드의 썸네일을 위해, 포스트별 "본문 첫 번째 이미지"를 빌드 시점에 뽑아 둔다.
 *
 * 홈에서 쓰는 getAllPosts()는 메타데이터만 반환하고 content를 담지 않으므로,
 * 런타임에는 본문 첫 이미지를 알 수 없다. 다만 buildImages가 이미 모든 포스트의
 * content를 가져오고 있어서, 여기서 같이 뽑으면 Notion API 추가 호출이 0이다.
 */
export type PostThumbnailMap = Record<string, string>;

/**
 * 이미 추출된 imageUrls의 순서를 그대로 신뢰한다.
 * collectPostBuildData가 [coverImage, ...본문 이미지] 순으로 채우므로,
 * 커버가 있으면 그것이, 없으면 본문 첫 이미지가 맨 앞에 온다.
 */
export function collectPostThumbnails(
  postBuildData: readonly PostBuildData[],
  imageMapping: ReadonlyMap<string, OptimizedImage>,
): PostThumbnailMap {
  const thumbnails: PostThumbnailMap = {};

  for (const { post, imageUrls } of postBuildData) {
    // 커버는 메타데이터로 런타임에 이미 알 수 있으므로 본문 이미지만 남긴다.
    const contentImageUrls = post.coverImage ? imageUrls.filter((url) => url !== post.coverImage) : imageUrls;

    const firstContentImage = contentImageUrls[0];
    if (!firstContentImage) continue;

    // 변환에 성공한 로컬 경로가 있으면 그것을, 없으면 원본 URL을 쓴다.
    const optimized = imageMapping.get(firstContentImage);
    thumbnails[post.slug] = optimized?.src ?? firstContentImage;
  }

  return thumbnails;
}

export function getPostThumbnailsPaths() {
  return {
    jsonPath: path.join(process.cwd(), "public", "images", "post-thumbnails.json"),
    tsPath: path.join(process.cwd(), "src", "shared", "utils", "postThumbnails.generated.ts"),
  };
}

export function savePostThumbnails(thumbnails: PostThumbnailMap): void {
  const { jsonPath, tsPath } = getPostThumbnailsPaths();

  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(thumbnails, null, 2));

  const tsContent = `// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// 빌드 시점에 scripts/buildImages.ts에서 생성됨

export const POST_THUMBNAILS: Record<string, string> = ${JSON.stringify(thumbnails, null, 2)};
`;

  fs.mkdirSync(path.dirname(tsPath), { recursive: true });
  fs.writeFileSync(tsPath, tsContent);

  console.log(`\n🖼️  포스트 썸네일 매핑 저장 (${Object.keys(thumbnails).length}개):`);
  console.log(`   - JSON: ${jsonPath}`);
  console.log(`   - TS: ${tsPath}`);
}
