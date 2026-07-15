import fs from "fs";
import path from "path";
import sharp from "sharp";

export interface OptimizedImage {
  src: string;
  width?: number;
  height?: number;
}

async function getImageDimensions(input: Buffer | string): Promise<Pick<OptimizedImage, "width" | "height">> {
  const { width, height } = await sharp(input, { animated: true }).metadata();
  return { width, height };
}

/**
 * Notion 이미지를 WebP로 변환하여 포스트별 폴더에 저장
 *
 * @param url - 이미지 URL
 * @param postSlug - 포스트 슬러그 (폴더명으로 사용)
 * @param imageIndex - 이미지 순서 (파일명으로 사용)
 * @param quality - WebP 품질 (1-100)
 * @returns 로컬 이미지 경로와 원본 크기
 */
/**
 * URL에서 이미지 확장자를 추출
 */
function getImageExtension(url: string): string {
  // URL에서 쿼리 파라미터 제거 후 확장자 추출
  const cleanUrl = url.split("?")[0];
  const ext = path.extname(cleanUrl).toLowerCase();
  return ext;
}

/**
 * GIF 이미지인지 확인
 */
function isGifUrl(url: string): boolean {
  return getImageExtension(url) === ".gif";
}

export async function convertImageToWebp(
  url: string,
  postSlug: string,
  imageIndex: number,
  quality = 85
): Promise<string> {
  try {
    const isGif = isGifUrl(url);
    const fileName = isGif ? `${imageIndex}.gif` : `${imageIndex}.webp`;
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

    console.log(`  🔄 ${postSlug}/${fileName}${isGif ? " (GIF 원본 유지)" : ""}`);

    // 이미지 다운로드
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isGif) {
      // GIF는 애니메이션 보존을 위해 원본 그대로 저장
      fs.writeFileSync(outputPath, buffer);
    } else {
      // WebP로 변환 및 저장
      await sharp(buffer).webp({ quality }).toFile(outputPath);
    }

    console.log(`  ✅ ${postSlug}/${fileName}`);
    return `/images/${postSlug}/${fileName}`;
  } catch (error) {
    console.error(`  ❌ 이미지 변환 실패: ${url}`, error);
    // 변환 실패 시 원본 URL 반환
    return url;
  }
}

/**
 * 포스트의 이미지들을 병렬로 변환
 */
export async function convertPostImages(
  postSlug: string,
  imageUrls: string[],
  quality = 85
): Promise<Map<string, OptimizedImage>> {
  const results = new Map<string, OptimizedImage>();

  if (imageUrls.length === 0) {
    return results;
  }

  console.log(`\n📸 [${postSlug}] ${imageUrls.length}개의 이미지 변환 중...\n`);

  // 병렬 처리: 모든 이미지를 동시에 변환
  const conversionResults = await Promise.all(
    imageUrls.map(async (url, index) => {
      const localPath = await convertImageToWebp(url, postSlug, index + 1, quality);
      const localImagePath = localPath.startsWith("/") ? path.join(process.cwd(), "public", localPath) : undefined;

      try {
        const dimensions = await getImageDimensions(localImagePath || localPath);
        return { url, image: { src: localPath, ...dimensions } };
      } catch (error) {
        console.warn(`  ⚠️  이미지 크기 추출 실패: ${localPath}`, error);
        return { url, image: { src: localPath } };
      }
    })
  );

  // 결과를 Map에 추가
  conversionResults.forEach(({ url, image }) => {
    results.set(url, image);
  });

  return results;
}

/**
 * 이미지 매핑 정보를 TypeScript 파일로 저장
 */
export function saveImageMapping(mapping: Map<string, OptimizedImage>): void {
  const mappingObj = Object.fromEntries(mapping);

  // JSON 파일 저장 (백업용)
  const jsonPath = path.join(process.cwd(), "public", "images", "image-mapping.json");
  fs.writeFileSync(jsonPath, JSON.stringify(mappingObj, null, 2));

  // TypeScript 상수 파일 생성
  const tsPath = path.join(process.cwd(), "src", "shared", "utils", "imageMapping.generated.ts");
  const tsContent = `// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// 빌드 시점에 scripts/buildImages.ts에서 생성됨

export const IMAGE_MAPPING = ${JSON.stringify(mappingObj, null, 2)} as const;
`;

  fs.writeFileSync(tsPath, tsContent);
  console.log(`\n💾 이미지 매핑 정보 저장:`);
  console.log(`   - JSON: ${jsonPath}`);
  console.log(`   - TS: ${tsPath}`);
}

/**
 * 저장된 이미지 매핑 정보 로드
 */
export async function loadImageMapping(): Promise<Map<string, OptimizedImage>> {
  const mappingPath = path.join(process.cwd(), "public", "images", "image-mapping.json");

  if (!fs.existsSync(mappingPath)) {
    return new Map();
  }

  const mappingObj = JSON.parse(fs.readFileSync(mappingPath, "utf-8")) as Record<string, string | OptimizedImage>;
  const mapping = new Map<string, OptimizedImage>();

  for (const [url, image] of Object.entries(mappingObj)) {
    const normalizedImage = typeof image === "string" ? { src: image } : image;

    if ((!normalizedImage.width || !normalizedImage.height) && normalizedImage.src.startsWith("/")) {
      try {
        Object.assign(normalizedImage, await getImageDimensions(path.join(process.cwd(), "public", normalizedImage.src)));
      } catch (error) {
        console.warn(`  ⚠️  기존 이미지 크기 추출 실패: ${normalizedImage.src}`, error);
      }
    }

    mapping.set(url, normalizedImage);
  }

  return mapping;
}
