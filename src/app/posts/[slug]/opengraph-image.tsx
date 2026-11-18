import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/features/notion";
import { BASE_URL } from "@/shared/constants";

export const alt = "박창준 블로그 글 표지";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// satori(ImageResponse)는 ttf/otf/woff만 읽고 woff2는 읽지 못하고, 폰트를 넘기지 않으면
// 라틴 문자 기본 폰트로 그려 한글 제목이 네모로 나온다. 빌드 때 public/fonts에 둔
// 한글 서브셋을 읽어 넘긴다(전체 주소는 public/fonts/README.md 참고).
const FONT_FAMILY = "Noto Sans KR";
const FONT_PATH = ["public", "fonts", "og-noto-sans-kr-bold.ttf"];
const FONT_URL_PATH = "/fonts/og-noto-sans-kr-bold.ttf";

/**
 * 폰트는 모듈이 처음 로드될 때 한 번만 준비한다.
 *
 * 정적 생성되는 글은 빌드 중에 이 모듈을 평가하므로 파일을 바로 읽을 수 있다.
 * 빌드 이후 발행되어 요청 시점에 그려지는 글은 서버리스 함수에서 실행되는데,
 * 그 환경에는 public/이 함수 번들에 들어 있지 않을 수 있어 같은 배포의 정적
 * 자산을 한 번 더 시도한다. 둘 다 실패하면 폰트 없이 그린다 — 이미지 생성이
 * 실패하는 것보다는 라틴 기본 폰트로라도 나오는 편이 낫다.
 */
const fontData = await loadFontData();

async function loadFontData(): Promise<ArrayBuffer | null> {
  try {
    const file = await readFile(join(process.cwd(), ...FONT_PATH));
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  } catch {
    // 아래 fetch로 넘어간다.
  }

  try {
    const response = await fetch(new URL(FONT_URL_PATH, BASE_URL));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.arrayBuffer();
  } catch (error) {
    console.warn("OG 이미지용 한글 폰트를 불러오지 못해 기본 폰트로 그립니다.", error);
    return null;
  }
}

const TITLE_MAX_LENGTH = 120;

/** 제목이 길수록 글자를 줄인다. 넘치는 것보다 작아지는 편이 낫다. */
function titleFontSize(title: string): number {
  if (title.length > 80) return 44;
  if (title.length > 50) return 54;
  return 68;
}

function truncateTitle(title: string): string {
  return title.length > TITLE_MAX_LENGTH ? `${title.slice(0, TITLE_MAX_LENGTH).trimEnd()}…` : title;
}

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const fontFamily = fontData ? FONT_FAMILY : "sans-serif";
  const fonts = fontData
    ? [{ name: FONT_FAMILY, data: fontData, style: "normal" as const, weight: 700 as const }]
    : undefined;

  try {
    const post = await getPostBySlug(slug);
    const title = truncateTitle(post.title);

    // toLocaleDateString은 실행 환경의 ICU에 따라 결과가 달라진다. 빌드 환경과
    // 요청 환경이 다를 수 있으므로 날짜는 직접 조립한다.
    const published = new Date(post.publishedAt);
    const formattedDate = `${published.getFullYear()}. ${published.getMonth() + 1}. ${published.getDate()}.`;
    const formattedTags = post.tags
      .slice(0, 3)
      .map((tag) => tag.name)
      .join(" · ");

    return new ImageResponse(
      (
        <div
          style={{
            background: "#ffffff",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            fontFamily,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "28px", color: "#476f56" }}>
            <div style={{ display: "flex", width: "56px", height: "8px", background: "#5a8a6d" }} />
            <div style={{ display: "flex" }}>박창준 블로그</div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: `${titleFontSize(title)}px`,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.32,
              letterSpacing: "-0.02em",
              maxWidth: "1040px",
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex", fontSize: "26px", color: "#4b5563", gap: "20px" }}>
            <div style={{ display: "flex" }}>{formattedDate}</div>
            {formattedTags ? <div style={{ display: "flex" }}>·</div> : null}
            {formattedTags ? <div style={{ display: "flex" }}>{formattedTags}</div> : null}
          </div>
        </div>
      ),
      {
        ...size,
        ...(fonts ? { fonts } : {}),
      },
    );
  } catch {
    // 글을 못 읽어도 공유 카드가 깨지지 않게 최소한의 표지를 그린다.
    return new ImageResponse(
      (
        <div
          style={{
            background: "#ffffff",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            fontFamily,
          }}
        >
          <div style={{ display: "flex", fontSize: "48px", fontWeight: 700, color: "#111827" }}>박창준 블로그</div>
          <div style={{ display: "flex", fontSize: "28px", color: "#4b5563" }}>글을 불러오지 못했습니다</div>
        </div>
      ),
      {
        ...size,
        ...(fonts ? { fonts } : {}),
      },
    );
  }
}
