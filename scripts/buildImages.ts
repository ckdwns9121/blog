import "dotenv/config";
import { getAllPosts, getPostByPageId } from "../src/features/notion/service/notion-client";
import { convertPostImages, saveImageMapping, loadImageMapping } from "./convertImages";
import { collectPostBuildData } from "./postBuildData";
import { getSearchIndexPath, publishSearchIndex, removeSearchIndex } from "./searchIndex";

/**
 * 증분 빌드: 변경된 이미지만 변환
 */
async function main() {
  try {
    console.log("\n🚀 증분 이미지 빌드 프로세스를 시작합니다...\n");
    console.log("━".repeat(60) + "\n");

    // 실패한 빌드가 이전 검색 데이터를 유효한 새 결과처럼 남기지 않도록 먼저 제거
    const searchIndexPath = getSearchIndexPath();
    await removeSearchIndex(searchIndexPath);

    // 1. 기존 매핑 로드
    console.log("📋 기존 이미지 매핑 정보를 로드하는 중...\n");
    const existingMapping = loadImageMapping();
    console.log(`   기존 매핑: ${existingMapping.size}개\n`);

    // 2. 모든 포스트 가져오기
    console.log("📚 모든 포스트를 가져오는 중...\n");
    const posts = await getAllPosts();
    console.log(`📄 총 ${posts.length}개의 포스트를 발견했습니다.\n`);

    console.log("━".repeat(60));

    // 3. 포스트별로 이미지 처리 (증분 빌드 + 병렬 처리)
    const allImageMapping = new Map<string, string>(existingMapping); // 기존 매핑 복사
    let totalImageCount = 0;
    let newImageCount = 0;
    let skippedImageCount = 0;

    // Notion API 요청은 내부 큐에서 조율되므로 작업 자체는 병렬로 위임
    console.log("📥 모든 포스트의 이미지 URL을 병렬로 추출하는 중...\n");
    const postImageData = await collectPostBuildData(posts, getPostByPageId);

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
    const searchDocuments = await publishSearchIndex(
      postImageData.map(({ post }) => post),
      searchIndexPath,
    );

    console.log("\n✅ 증분 이미지 빌드 완료!\n");
    console.log(`📊 처리된 포스트: ${posts.length}개`);
    console.log(`📸 총 이미지: ${totalImageCount}개`);
    console.log(`   - 새로 변환: ${newImageCount}개`);
    console.log(`   - 기존 이미지 스킵: ${skippedImageCount}개`);
    console.log(`📁 저장 위치: public/images/[post-slug]/`);
    console.log(`📋 매핑 파일: public/images/image-mapping.json\n`);
    console.log(`🔎 검색 인덱스: ${searchIndexPath} (${searchDocuments.length}개)\n`);
  } catch (error) {
    console.error("\n❌ 이미지 빌드 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
