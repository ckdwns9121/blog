import { Client } from "@notionhq/client";
import type {
  NotionPost,
  NotionBlock,
  NotionPage,
  NotionBlockType,
  NotionRichText,
  NotionPropertyValue,
  NotionCheckboxProperty,
  NotionTitleProperty,
  NotionRichTextProperty,
  NotionMultiSelectProperty,
  NotionUrlProperty,
  NotionFileProperty,
  NotionDateProperty,
  BlockContent,
} from "../types";
import type { BlogPost } from "@/entities/post/model";
import { adaptNotionBlocksToContentBlocks } from "../utils/blockAdapter";
import { readPageBlocksCache, writePageBlocksCache } from "./notion-cache";

// Singleton client instance
let client: Client | null = null;
let lastNotionRequestAt = 0;
let notionRequestQueue: Promise<void> = Promise.resolve();

const NOTION_MIN_REQUEST_INTERVAL_MS = 400;
const NOTION_MAX_RETRY_COUNT = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForNotionRequestSlot(): Promise<void> {
  const previousRequest = notionRequestQueue;
  let releaseRequestSlot!: () => void;

  notionRequestQueue = new Promise<void>((resolve) => {
    releaseRequestSlot = resolve;
  });

  await previousRequest;

  try {
    const now = Date.now();
    const elapsed = now - lastNotionRequestAt;

    if (elapsed < NOTION_MIN_REQUEST_INTERVAL_MS) {
      await sleep(NOTION_MIN_REQUEST_INTERVAL_MS - elapsed);
    }

    lastNotionRequestAt = Date.now();
  } finally {
    releaseRequestSlot();
  }
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const notionError = error as { status?: number; code?: string };
  return notionError.status === 429 || notionError.code === "rate_limited";
}

function getRetryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 10000);
}

async function runNotionRequest<T>(request: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= NOTION_MAX_RETRY_COUNT; attempt++) {
    await waitForNotionRequestSlot();

    try {
      return await request();
    } catch (error) {
      if (!isRateLimitError(error) || attempt === NOTION_MAX_RETRY_COUNT) {
        throw error;
      }

      const retryDelayMs = getRetryDelayMs(attempt);
      console.warn(`Notion API rate limited. Retrying in ${retryDelayMs}ms...`);
      await sleep(retryDelayMs);
    }
  }

  throw new Error("Notion request retry loop exited unexpectedly");
}

function initialize() {
  if (client) return; // 이미 초기화됨

  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    throw new Error("NOTION_API_KEY is required. Please set it in .env.local");
  }

  client = new Client({ auth: apiKey, notionVersion: "2025-09-03" });
}

function getClient(): Client {
  initialize();
  return client!;
}

// 포스트 메타데이터 조회
export async function getAllPosts(): Promise<NotionPost[]> {
  const results: NotionPost[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await runNotionRequest(() =>
      getClient().search({
        query: "",
        page_size: 100,
        start_cursor: cursor,
      })
    );

    const posts: Array<NotionPost | null> = [];
    for (const page of response.results) {
      try {
        const pageData =
          page.object === "page" && "properties" in page
            ? (page as NotionPage)
            : ((await runNotionRequest(() =>
                getClient().pages.retrieve({
                  page_id: page.id,
                })
              )) as NotionPage);

        if (pageData.object === "page") {
          const notionPage = pageData as NotionPage;
          const properties = notionPage.properties;

          const publishedProperty = properties.published as NotionCheckboxProperty | undefined;
          const titleProperty = getPlainText(properties.title);

          if (publishedProperty?.checkbox && titleProperty) {
            const originalSlug = getPlainText(properties.slug);
            const generatedSlug = slugify(titleProperty);
            const baseSlug = originalSlug || generatedSlug || "post";

            // pageId에서 하이픈 제거 (전체 32자리)
            const pageIdWithoutHyphens = notionPage.id.replace(/-/g, "");

            // slug + pageId 조합 (예: javascript-promise-8618d667c89b3708a1b2c3d4e5f6g7h8)
            const validSlug = `${baseSlug}-${pageIdWithoutHyphens}`;

            const publishedAtDate = getDate(properties.publishedAt);

            // 날짜 유효성 재검증
            const createdAt = notionPage.created_time || new Date().toISOString();
            const updatedAt = notionPage.last_edited_time || new Date().toISOString();
            const publishedAt = publishedAtDate || createdAt;

            // 커버 이미지 URL 처리 (S3 URL인 경우 공개 프록시 URL로 변환)
            const rawCoverImage = getImageUrl(properties.coverImage);
            const coverImage = rawCoverImage ? convertToPublicNotionImageUrl(rawCoverImage, notionPage.id) : undefined;

            posts.push({
              id: notionPage.id,
              title: titleProperty,
              slug: validSlug,
              published: publishedProperty.checkbox,
              createdAt,
              publishedAt,
              updatedAt,
              tags: (getMultiSelect(properties.tags) || []).map((tag: string) => ({
                name: tag,
                slug: tagSlug(tag),
              })),
              excerpt: getPlainText(properties.excerpt),
              coverImage,
            } as NotionPost);
            continue;
          }
        }
      } catch (pageError) {
        const error = pageError as Error & { code?: string };
        if (error.code !== "object_not_found") {
          console.warn(`Failed to process page ${page.id}:`, error.message);
        }
      }

      posts.push(null);
    }

    results.push(...posts.filter((post): post is NotionPost => post !== null));
    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
  }

  return results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// 특정 포스트 상세 조회 (pageId로 직접 조회)
export async function getPostBySlug(slug: string, fetchContent = true): Promise<BlogPost> {
  // slug에서 마지막 부분(pageId) 추출
  const decodedSlug = decodeURIComponent(slug);
  const parts = decodedSlug.split("-");
  const pageIdWithoutHyphens = parts[parts.length - 1];

  // pageId가 32자리인지 확인
  if (pageIdWithoutHyphens.length !== 32) {
    throw new Error(`Invalid slug format: "${slug}". Expected format: slug-{32-char-page-id}`);
  }

  // pageId에 하이픈 추가 (UUID 형식으로 복원: 8-4-4-4-12)
  const pageId = `${pageIdWithoutHyphens.slice(0, 8)}-${pageIdWithoutHyphens.slice(8, 12)}-${pageIdWithoutHyphens.slice(
    12,
    16
  )}-${pageIdWithoutHyphens.slice(16, 20)}-${pageIdWithoutHyphens.slice(20)}`;

  return getPostByPageId(pageId, fetchContent);
}

// pageId로 직접 포스트 조회
export async function getPostByPageId(pageId: string, fetchContent = true): Promise<BlogPost> {
  // 페이지 메타데이터를 먼저 가져와서 last_edited_time으로 캐시 유효성 판단
  const pageData = await runNotionRequest(() => getClient().pages.retrieve({ page_id: pageId }));

  if (!("properties" in pageData)) {
    throw new Error("Invalid page");
  }

  const page = pageData as NotionPage;

  // 블록 조회: 캐시 우선, 미스 시 API 호출
  let blocks: NotionBlock[] = [];
  if (fetchContent) {
    const cached = readPageBlocksCache(page.id, page.last_edited_time);
    if (cached) {
      blocks = cached;
    } else {
      blocks = await getPostBlocks(page.id);
      writePageBlocksCache(page.id, page.last_edited_time, blocks);
    }
  }

  const properties = page.properties;

  const title = getPlainText(properties.title) || "Untitled";
  const tags = getMultiSelect(properties.tags) || [];
  const excerpt = getPlainText(properties.excerpt) || "";
  const publishedAtDate = getDate(properties.publishedAt);
  const publishedAt = publishedAtDate || page.created_time;

  // pageId에서 하이픈 제거
  const pageIdWithoutHyphens = page.id.replace(/-/g, "");
  const baseSlug = getPlainText(properties.slug) || slugify(title);
  const slug = `${baseSlug}-${pageIdWithoutHyphens}`;

  // 커버 이미지 URL 처리
  const rawCoverImage = getImageUrl(properties.coverImage);
  const coverImage = rawCoverImage ? convertToPublicNotionImageUrl(rawCoverImage, page.id) : undefined;

  // NotionBlock을 공통 ContentBlock으로 변환
  const contentBlocks = adaptNotionBlocksToContentBlocks(blocks);

  return {
    id: page.id,
    title,
    slug,
    content: contentBlocks,
    excerpt,
    publishedAt: new Date(publishedAt),
    updatedAt: new Date(page.last_edited_time),

    tags: tags.map((tag: string) => ({
      name: tag,
      slug: tagSlug(tag),
      postCount: 0,
    })),
    coverImage,
    toc: [],
  };
}

// 포스트 콘텐츠 변환 (블록 형태로)
export async function getPostBlocks(pageId: string): Promise<NotionBlock[]> {
  const allBlocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  // 모든 블록을 페이지네이션으로 가져오기
  while (hasMore) {
    const response = await runNotionRequest(() =>
      getClient().blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: cursor,
      })
    );

    const blocks = await Promise.all(
      response.results.map(async (block) => {
        const notionBlock = block as NotionBlockType;
        const baseBlock = {
          id: notionBlock.id,
          type: notionBlock.type,
          content: extractBlockContent(notionBlock),
          children: undefined as NotionBlock[] | undefined,
        };

        // children이 있는 경우 재귀적으로 가져오기
        if (notionBlock.has_children) {
          baseBlock.children = await getPostBlocks(notionBlock.id);
        }

        return baseBlock;
      })
    );

    allBlocks.push(...blocks);

    hasMore = response.has_more;
    cursor = response.next_cursor || undefined;
  }

  return allBlocks;
}

// 태그별 포스트 필터링
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const filteredPosts = posts.filter((post) => post.tags.some((t) => t.name === tag));

  return Promise.all(filteredPosts.map((post) => getPostBySlug(post.slug)));
}

// Helper functions
function getPlainText(property: NotionPropertyValue | undefined): string {
  if (!property) return "";

  if (property.type === "title") {
    const titleProp = property as NotionTitleProperty;
    return titleProp.title.map((item) => item.plain_text).join("");
  }

  if (property.type === "rich_text") {
    const richTextProp = property as NotionRichTextProperty;
    return richTextProp.rich_text.map((item) => item.plain_text).join("");
  }

  return "";
}

function getMultiSelect(property: NotionPropertyValue | undefined): string[] {
  if (!property) return [];

  if (property.type === "multi_select") {
    const multiSelectProp = property as NotionMultiSelectProperty;
    return multiSelectProp.multi_select.map((item) => item.name);
  }

  return [];
}

function getImageUrl(property: NotionPropertyValue | undefined): string | undefined {
  if (!property) return undefined;

  if (property.type === "url") {
    const urlProp = property as NotionUrlProperty;
    return urlProp.url || undefined;
  }

  if (property.type === "files") {
    const fileProp = property as NotionFileProperty;
    const firstFile = fileProp.files[0];
    return firstFile?.external?.url || firstFile?.file?.url || undefined;
  }

  return undefined;
}

function getDate(property: NotionPropertyValue | undefined): string {
  if (!property) return new Date().toISOString();

  if (property.type === "date") {
    const dateProp = property as NotionDateProperty;
    const dateStr = dateProp.date?.start;

    // 날짜가 없거나 유효하지 않으면 현재 시간 반환
    if (!dateStr) return new Date().toISOString();

    // 날짜 유효성 검증
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return dateStr;
  }

  return new Date().toISOString();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/** Preserve Unicode letters in tag URLs without changing existing post slugs. */
export function tagSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/**
 * Notion S3 이미지 URL을 Notion의 공개 이미지 프록시 URL로 변환
 * 이렇게 하면 1시간 만료 문제를 해결할 수 있습니다.
 *
 * @param notionImageUrl - Notion S3 signed URL
 * @param blockId - 이미지 블록의 ID
 * @returns 공개 접근 가능한 Notion 이미지 URL
 */
function convertToPublicNotionImageUrl(notionImageUrl: string, blockId: string): string {
  // 이미 변환된 URL이거나 외부 URL인 경우 그대로 반환
  if (!notionImageUrl.includes("prod-files-secure.s3") && !notionImageUrl.includes("s3.us-west-2.amazonaws.com")) {
    return notionImageUrl;
  }

  // Signed URL의 쿼리 파라미터 제거 (baseUrl만 추출)
  const baseUrl = notionImageUrl.split("?")[0];

  // Workspace ID 추출 (URL 패턴: .../workspace-id/file-id/...)
  const workspaceIdMatch = baseUrl.match(/amazonaws\.com\/([^/]+)\//);
  const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : "";

  // Notion 공개 이미지 프록시 URL 생성
  // 이 방식은 Notion의 공개 페이지에서 사용하는 실제 패턴입니다
  const encodedUrl = encodeURIComponent(baseUrl);

  // workspace ID가 있으면 spaceId 파라미터 추가
  if (workspaceId) {
    return `https://www.notion.so/image/${encodedUrl}?table=block&id=${blockId}&spaceId=${workspaceId}&cache=v2`;
  }

  return `https://www.notion.so/image/${encodedUrl}?table=block&id=${blockId}&cache=v2`;
}

function extractText(richText: NotionRichText[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((text) => text.plain_text).join("");
}

function extractBlockContent(block: NotionBlockType): BlockContent {
  switch (block.type) {
    case "heading_1":
      return {
        type: "rich_text" as const,
        rich_text: block.heading_1.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "heading_2":
      return {
        type: "rich_text" as const,
        rich_text: block.heading_2.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "heading_3":
      return {
        type: "rich_text" as const,
        rich_text: block.heading_3.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "heading_4":
      return {
        type: "rich_text" as const,
        rich_text: block.heading_4.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "paragraph":
      return {
        type: "rich_text" as const,
        rich_text: block.paragraph.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "bulleted_list_item":
      return {
        type: "rich_text" as const,
        rich_text: block.bulleted_list_item.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "numbered_list_item":
      return {
        type: "rich_text" as const,
        rich_text: block.numbered_list_item.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "code":
      return {
        type: "code" as const,
        text: extractText(block.code.rich_text),
        language: block.code.language,
      };
    case "quote":
      return {
        type: "rich_text" as const,
        rich_text: block.quote.rich_text.map((rt) => ({
          plain_text: rt.plain_text,
          href: rt.href,
          annotations: rt.annotations,
        })),
      };
    case "image": {
      const imageUrl = block.image.external?.url || block.image.file?.url || "";
      // S3 URL을 Notion 공개 프록시 URL로 변환하여 만료 문제 해결
      const publicUrl = imageUrl ? convertToPublicNotionImageUrl(imageUrl, block.id) : "";
      return {
        type: "image" as const,
        url: publicUrl,
        caption: extractText(block.image.caption || []),
      };
    }
    case "video": {
      const videoUrl = block.video.external?.url || block.video.file?.url || "";
      // 비디오도 동일하게 처리 (Notion 내부 비디오인 경우)
      const publicVideoUrl = videoUrl ? convertToPublicNotionImageUrl(videoUrl, block.id) : "";
      return {
        type: "image" as const, // video도 ImageContent 타입 사용
        url: publicVideoUrl,
        caption: extractText(block.video.caption || []),
      };
    }
    case "divider":
      return { type: "plain_text" as const, text: "" };
    case "bookmark": {
      return {
        type: "bookmark" as const,
        url: block.bookmark.url,
        caption: extractText(block.bookmark.caption || []),
      };
    }
    case "link_preview": {
      return {
        type: "bookmark" as const,
        url: block.link_preview.url,
      };
    }
    case "table": {
      return {
        type: "table" as const,
        width: block.table.table_width,
        has_column_header: block.table.has_column_header,
        has_row_header: block.table.has_row_header,
      };
    }
    case "table_row": {
      return {
        type: "table_row" as const,
        cells: block.table_row.cells.map((cell) =>
          cell.map((rt) => ({
            rich_text: [
              {
                plain_text: rt.plain_text,
                href: rt.href,
                annotations: rt.annotations,
              },
            ],
          })),
        ),
      };
    }
    default:
      // TypeScript exhaustiveness check - 모든 블록 타입이 처리됨
      const _exhaustiveCheck: never = block;
      console.log(`Unknown block type:`, _exhaustiveCheck);
      return { type: "plain_text" as const, text: "" };
  }
}
