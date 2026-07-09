import "dotenv/config";
import { getAllPosts, getPostByPageId } from "../src/features/notion/service/notion-client";
import { convertPostImages, saveImageMapping, loadImageMapping } from "./convertImages";
import type { ContentBlockWithChildren } from "../src/shared/types/content";

/**
 * 콘텐츠 블록에서 모든 이미지 URL을 재귀적으로 추출
 */
function extractImageUrlsFromBlocks(blocks: ContentBlockWithChildren[]): string[] {
  const imageUrls: string[] = [];

  for (const block of blocks) {
    // 이미지 블록인 경우
    if (block.type === "image" && block.url) {
      imageUrls.push(block.url);
    }

    // 자식 블록도 재귀적으로 확인
    if (block.children && block.children.length > 0) {
      imageUrls.push(...extractImageUrlsFromBlocks(block.children));
    }
  }

  return imageUrls;
}

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

    if (fullPost.content && fullPost.content.length > 0) {
      const contentImageUrls = extractImageUrlsFromBlocks(fullPost.content);
      imageUrls.push(...contentImageUrls);
    }

    return imageUrls;
  } catch (error) {
    console.warn(`  ⚠️  콘텐츠 가져오기 실패: ${postSlug}`, error);
    return imageUrls;
  }
}

/**
 * 증분 빌드: 변경된 이미지만 변환
 */
async function main() {
  try {
    console.log("\n🚀 증분 이미지 빌드 프로세스를 시작합니다...\n");
    console.log("━".repeat(60) + "\n");

    // 1. 기존 매핑 로드
    console.log("📋 기존 이미지 매핑 정보를 로드하는 중...\n");
    const existingMapping = loadImageMapping();
    console.log(`   기존 매핑: ${existingMapping.size}개\n`);

    // 2. 모든 포스트 가져오기
    console.log("📚 모든 포스트를 가져오는 중...\n");
    const posts = await getAllPosts();
    console.log(`📄 총 ${posts.length}개의 포스트를 발견했습니다.\n`);

    if (posts.length === 0) {
      console.log("ℹ️  변환할 포스트가 없습니다.");
      return;
    }

    console.log("━".repeat(60));

    // 3. 포스트별로 이미지 처리 (증분 빌드 + 병렬 처리)
    const allImageMapping = new Map<string, string>(existingMapping); // 기존 매핑 복사
    let totalImageCount = 0;
    let newImageCount = 0;
    let skippedImageCount = 0;

    // Notion API rate limit을 피하기 위해 포스트별 이미지 URL은 순차 추출
    console.log("📥 모든 포스트의 이미지 URL을 추출하는 중...\n");
    const postImageData: Array<{ post: (typeof posts)[number]; imageUrls: string[] }> = [];
    for (const post of posts) {
      const imageUrls = await extractPostImageUrls(post.id, post.slug, post.coverImage);
      postImageData.push({ post, imageUrls });
    }

    console.log("━".repeat(60));

    // 각 포스트의 이미지 변환 (병렬 처리)
    const imageConversionResults = await Promise.all(
      postImageData.map(async ({ post, imageUrls }) => {
        if (imageUrls.length === 0) {
          console.log(`\n📄 [${post.title}] 이미지 없음`);
          return { post, newCount: 0, skippedCount: 0, totalCount: 0 };
        }

        // 기존 매핑에 없는 새 이미지만 필터링
        const newImageUrls = imageUrls.filter((url) => !existingMapping.has(url));
        const existingImageUrls = imageUrls.filter((url) => existingMapping.has(url));

        if (newImageUrls.length > 0) {
          console.log(`\n📸 [${post.title}] ${newImageUrls.length}개의 새 이미지 변환 중...\n`);

          // 새 이미지만 변환
          const postMapping = await convertPostImages(post.slug, newImageUrls, 85);

          // 전체 매핑에 추가
          postMapping.forEach((localPath, url) => {
            allImageMapping.set(url, localPath);
          });

          console.log(`  ✨ [${post.title}] ${newImageUrls.length}개 새로 변환 완료`);
          return {
            post,
            newCount: newImageUrls.length,
            skippedCount: existingImageUrls.length,
            totalCount: imageUrls.length,
          };
        } else {
          console.log(`\n📄 [${post.title}] 모든 이미지가 이미 변환됨 (${existingImageUrls.length}개 스킵)`);
          return { post, newCount: 0, skippedCount: existingImageUrls.length, totalCount: imageUrls.length };
        }
      })
    );

    // 통계 집계
    imageConversionResults.forEach((result) => {
      totalImageCount += result.totalCount;
      newImageCount += result.newCount;
      skippedImageCount += result.skippedCount;
    });

    // 4. 매핑 정보 저장
    console.log("\n" + "━".repeat(60));
    saveImageMapping(allImageMapping);

    console.log("\n✅ 증분 이미지 빌드 완료!\n");
    console.log(`📊 처리된 포스트: ${posts.length}개`);
    console.log(`📸 총 이미지: ${totalImageCount}개`);
    console.log(`   - 새로 변환: ${newImageCount}개`);
    console.log(`   - 기존 이미지 스킵: ${skippedImageCount}개`);
    console.log(`📁 저장 위치: public/images/[post-slug]/`);
    console.log(`📋 매핑 파일: public/images/image-mapping.json\n`);
  } catch (error) {
    console.error("\n❌ 이미지 빌드 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
