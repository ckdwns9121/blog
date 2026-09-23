import fs from "fs";
import path from "path";
import { normalizeThumbnailKey } from "../src/shared/utils/thumbnailKey";

/**
 * 글별 대표 이미지(썸네일) 맵을 빌드 시점에 생성한다.
 *
 * 목록 화면의 썸네일은 "커버 이미지 → 본문 첫 이미지" 순으로 결정되는데,
 * 본문 첫 이미지를 알아내려면 글마다 Notion 블록을 받아와야 한다.
 * 목록을 그리는 모든 경로(홈, 태그, 피드, 글 상세의 이전/다음 계산)에서
 * 이 조회가 반복되면서 Notion 요청이 글 수만큼 배로 늘어났다.
 *
 * 빌드 스크립트는 이미 모든 글의 본문 이미지를 수집하고 있으므로,
 * 그 결과에서 첫 이미지만 뽑아 맵으로 저장해두면 런타임 조회가 사라진다.
 *
 * 값의 의미:
 * - 문자열: 해당 글의 대표 이미지 URL
 * - 빈 문자열: 이미지가 없는 글이라는 것을 "확인했음" (재조회 불필요)
 * - 키 없음: 빌드 이후 발행된 글. 이 글만 런타임에 조회한다.
 */

export interface ThumbnailSource {
  /** Notion 페이지 ID */
  id: string;
  /** 커버 이미지가 앞에 오고 본문 이미지가 뒤따르는 순서 */
  imageUrls: readonly string[];
}

export type ThumbnailMap = Record<string, string>;

export function buildThumbnailMap(sources: readonly ThumbnailSource[]): ThumbnailMap {
  const map: ThumbnailMap = {};

  for (const { id, imageUrls } of sources) {
    const first = imageUrls.find((url) => typeof url === "string" && url.trim().length > 0);
    map[normalizeThumbnailKey(id)] = first?.trim() ?? "";
  }

  return map;
}

export function getThumbnailMapPath(cwd = process.cwd()): string {
  return path.join(cwd, "src", "shared", "utils", "thumbnailMap.generated.ts");
}

export function saveThumbnailMap(map: ThumbnailMap, cwd = process.cwd()): string {
  const outputPath = getThumbnailMapPath(cwd);
  const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  const body = Object.fromEntries(entries);

  const contents = `// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// 빌드 시점에 scripts/buildImages.ts에서 생성됨
//
// 값이 빈 문자열이면 "이미지가 없는 글"로 확인된 것이고,
// 키 자체가 없으면 빌드 이후 발행된 글이라 런타임에서 한 번 조회한다.

export const THUMBNAIL_MAP: Record<string, string> = ${JSON.stringify(body, null, 2)};
`;

  fs.writeFileSync(outputPath, contents);
  return outputPath;
}
