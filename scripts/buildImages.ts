import "dotenv/config";
import { getAllPosts, getPostByPageId } from "../src/features/notion/api/client";
import { convertPostImages, saveImageMapping } from "./convertImages";
import type { ImageContent } from "../src/features/notion/types";

/**
 * 포스트의 모든 이미지 URL 추출
 */
async function extractPostImageUrls(postId: string, postSlug: string, coverImage?: string): Promise<string[]> {
  const imageUrls: string[] = [];

  try {
    // 커버 이미지
    if (coverImage) {
      imageUrls.push(coverImage);
    }

    // 포스트 콘텐츠의 이미지
    const fullPost = await getPostByPageId(postId, true);

    if (fullPost.content) {
      for (const block of fullPost.content) {
        // ImageContent 타입인지 체크
        if (typeof block.content === "object" && "type" in block.content && block.content.type === "image") {
          const imageContent = block.content as ImageContent;
          if (imageContent.url) {
            imageUrls.push(imageContent.url);
          }
        }
      }
    }

    return imageUrls;
  } catch (error) {
    console.warn(`  ⚠️  콘텐츠 가져오기 실패: ${postSlug}`, error);
    return imageUrls;
  }
}

/**
 * 빌드 시점에 모든 이미지 변환 실행
 */
async function main() {
  try {
    console.log("\n🚀 이미지 빌드 프로세스를 시작합니다...\n");
    console.log("━".repeat(60) + "\n");

    // 1. 모든 포스트 가져오기
    console.log("📚 모든 포스트를 가져오는 중...\n");
    const posts = await getAllPosts();
    console.log(`📄 총 ${posts.length}개의 포스트를 발견했습니다.\n`);

    if (posts.length === 0) {
      console.log("ℹ️  변환할 포스트가 없습니다.");
      return;
    }

    console.log("━".repeat(60));

    // 2. 포스트별로 이미지 처리
    const allImageMapping = new Map<string, string>();
    let totalImageCount = 0;

    for (const post of posts) {
      // 포스트의 이미지 URL 추출
      const imageUrls = await extractPostImageUrls(post.id, post.slug, post.coverImage);

      if (imageUrls.length === 0) {
        console.log(`\n📄 [${post.title}] 이미지 없음`);
        continue;
      }

      // 포스트의 이미지 변환
      const postMapping = await convertPostImages(post.slug, imageUrls, 85);

      // 전체 매핑에 추가
      postMapping.forEach((localPath, url) => {
        allImageMapping.set(url, localPath);
      });

      totalImageCount += imageUrls.length;
      console.log(`  ✨ ${imageUrls.length}개 완료`);
    }

    // 3. 매핑 정보 저장
    console.log("\n" + "━".repeat(60));
    saveImageMapping(allImageMapping);

    console.log("\n✅ 이미지 빌드 완료!\n");
    console.log(`📊 처리된 포스트: ${posts.length}개`);
    console.log(`📸 변환된 이미지: ${totalImageCount}개`);
    console.log(`📁 저장 위치: public/images/[post-slug]/`);
    console.log(`📋 매핑 파일: public/images/image-mapping.json\n`);
  } catch (error) {
    console.error("\n❌ 이미지 빌드 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
