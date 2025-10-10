import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Notion 이미지를 WebP로 변환하여 포스트별 폴더에 저장
 *
 * @param url - 이미지 URL
 * @param postSlug - 포스트 슬러그 (폴더명으로 사용)
 * @param imageIndex - 이미지 순서 (파일명으로 사용)
 * @param quality - WebP 품질 (1-100)
 * @returns 로컬 이미지 경로
 */
export async function convertImageToWebp(
  url: string,
  postSlug: string,
  imageIndex: number,
  quality = 85
): Promise<string> {
  try {
    const fileName = `${imageIndex}.webp`;
    const outputDir = path.join(process.cwd(), "public", "images", postSlug);
    const outputPath = path.join(outputDir, fileName);

    // 이미 변환된 이미지가 있으면 스킵
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  ${postSlug}/${fileName}`);
      return `/images/${postSlug}/${fileName}`;
    }

    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`  🔄 ${postSlug}/${fileName}`);

    // Notion 이미지 다운로드
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // WebP로 변환 및 저장
    await sharp(buffer).webp({ quality }).toFile(outputPath);

    console.log(`  ✅ ${postSlug}/${fileName}`);
    return `/images/${postSlug}/${fileName}`;
  } catch (error) {
    console.error(`  ❌ 이미지 변환 실패: ${url}`, error);
    // 변환 실패 시 원본 URL 반환
    return url;
  }
}

/**
 * 포스트의 이미지들을 순서대로 변환
 */
export async function convertPostImages(
  postSlug: string,
  imageUrls: string[],
  quality = 85
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  if (imageUrls.length === 0) {
    return results;
  }

  console.log(`\n📸 [${postSlug}] ${imageUrls.length}개의 이미지 변환 중...\n`);

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const localPath = await convertImageToWebp(url, postSlug, i + 1, quality);
    results.set(url, localPath);
  }

  return results;
}

/**
 * 이미지 매핑 정보를 TypeScript 파일로 저장
 */
export function saveImageMapping(mapping: Map<string, string>): void {
  const mappingObj = Object.fromEntries(mapping);

  // JSON 파일 저장 (백업용)
  const jsonPath = path.join(process.cwd(), "public", "images", "image-mapping.json");
  fs.writeFileSync(jsonPath, JSON.stringify(mappingObj, null, 2));

  // TypeScript 상수 파일 생성
  const tsPath = path.join(process.cwd(), "src", "shared", "utils", "imageMapping.generated.ts");
  const tsContent = `// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// 빌드 시점에 scripts/buildImages.ts에서 생성됨

export const IMAGE_MAPPING: Record<string, string> = ${JSON.stringify(mappingObj, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent);
  console.log(`\n💾 이미지 매핑 정보 저장:`);
  console.log(`   - JSON: ${jsonPath}`);
  console.log(`   - TS: ${tsPath}`);
}

/**
 * 저장된 이미지 매핑 정보 로드
 */
export function loadImageMapping(): Map<string, string> {
  const mappingPath = path.join(process.cwd(), "public", "images", "image-mapping.json");

  if (!fs.existsSync(mappingPath)) {
    return new Map();
  }

  const mappingObj = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
  return new Map(Object.entries(mappingObj));
}
