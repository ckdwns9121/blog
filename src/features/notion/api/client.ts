import { Client } from "@notionhq/client";
import type {
  NotionPost,
  BlogPost,
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
  NotionNumberProperty,
  NotionDateProperty,
  BlockContent,
} from "../types";

export class NotionClient {
  private client: Client;
  private databaseId: string;

  constructor() {
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!apiKey) {
      throw new Error("NOTION_API_KEY is required. Please set it in .env.local");
    }

    if (!dbId) {
      throw new Error("NOTION_DATABASE_ID is required. Please set it in .env.local");
    }

    this.databaseId = dbId;
    this.client = new Client({ auth: apiKey });
  }

  // 포스트 메타데이터 조회
  async getAllPosts(): Promise<NotionPost[]> {
    const response = await this.client.search({
      query: "",
      page_size: 100,
    });

    const posts: NotionPost[] = [];

    for (const page of response.results.slice(0, 50)) {
      try {
        const pageData = await this.client.pages.retrieve({
          page_id: page.id,
        });

        if (pageData.object === "page") {
          const notionPage = pageData as NotionPage;
          const properties = notionPage.properties;

          const publishedProperty = properties.published as NotionCheckboxProperty | undefined;
          const titleProperty = this.getPlainText(properties.title);

          if (publishedProperty?.checkbox && titleProperty) {
            const originalSlug = this.getPlainText(properties.slug);
            const generatedSlug = this.slugify(titleProperty);
            const finalSlug = originalSlug || generatedSlug;
            const validSlug = finalSlug || `post-${notionPage.id.slice(-8)}`;

            const readingTimeProperty = properties.readingTime as NotionNumberProperty | undefined;
            const publishedAtDate = this.getDate(properties.publishedAt);

            // 날짜 유효성 재검증
            const createdAt = notionPage.created_time || new Date().toISOString();
            const updatedAt = notionPage.last_edited_time || new Date().toISOString();
            const publishedAt = publishedAtDate || createdAt;

            posts.push({
              id: notionPage.id,
              title: titleProperty,
              slug: validSlug,
              published: publishedProperty.checkbox,
              createdAt,
              publishedAt,
              updatedAt,
              category: this.getPlainText(properties.category) || "기타",
              tags: this.getMultiSelect(properties.tags) || [],
              excerpt: this.getPlainText(properties.excerpt),
              coverImage: this.getUrl(properties.coverImage),
              readingTime: readingTimeProperty?.number || 0,
            });
          }
        }
      } catch (pageError) {
        const error = pageError as Error & { code?: string };
        if (error.code !== "object_not_found") {
          console.warn(`Failed to process page ${page.id}:`, error.message);
        }
      }
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 특정 포스트 상세 조회
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const posts = await this.getAllPosts();
    const decodedSlug = decodeURIComponent(slug);
    const post = posts.find((p) => p.slug === decodedSlug || p.slug === slug);

    if (!post) {
      throw new Error(`Post with slug "${slug}" not found`);
    }

    const blocks = await this.getPostBlocks(post.id);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: blocks,
      excerpt: post.excerpt || "",
      publishedAt: new Date(post.publishedAt),
      updatedAt: new Date(post.updatedAt),
      category: {
        name: post.category,
        slug: this.slugify(post.category),
        postCount: 0,
      },
      tags: (post.tags || []).map((tag) => ({
        name: tag,
        slug: this.slugify(tag),
        postCount: 0,
      })),
      coverImage: post.coverImage,
      readingTime: post.readingTime || 0,
      toc: [],
    };
  }

  // 포스트 콘텐츠 변환 (블록 형태로)
  async getPostBlocks(pageId: string): Promise<NotionBlock[]> {
    const response = await this.client.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return response.results.map((block) => {
      const notionBlock = block as NotionBlockType;
      return {
        id: notionBlock.id,
        type: notionBlock.type,
        content: this.extractBlockContent(notionBlock),
        children: notionBlock.has_children ? [] : undefined,
      };
    });
  }

  // 카테고리 목록 조회
  async getCategories(): Promise<string[]> {
    const posts = await this.getAllPosts();
    const categories = new Set<string>();

    posts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    return Array.from(categories);
  }

  // 카테고리별 포스트 필터링
  async getPostsByCategory(category: string): Promise<BlogPost[]> {
    const posts = await this.getAllPosts();
    const filteredPosts = posts.filter((post) => post.category === category);

    return Promise.all(filteredPosts.map((post) => this.getPostBySlug(post.slug)));
  }

  // 태그별 포스트 필터링
  async getPostsByTag(tag: string): Promise<BlogPost[]> {
    const posts = await this.getAllPosts();
    const filteredPosts = posts.filter((post) => post.tags.includes(tag));

    return Promise.all(filteredPosts.map((post) => this.getPostBySlug(post.slug)));
  }

  // Helper methods
  private getPlainText(property: NotionPropertyValue | undefined): string {
    if (!property) return "";

    if (property.type === "title") {
      const titleProp = property as NotionTitleProperty;
      return titleProp.title.length > 0 ? titleProp.title[0].plain_text : "";
    }

    if (property.type === "rich_text") {
      const richTextProp = property as NotionRichTextProperty;
      return richTextProp.rich_text.length > 0 ? richTextProp.rich_text[0].plain_text : "";
    }

    return "";
  }

  private getMultiSelect(property: NotionPropertyValue | undefined): string[] {
    if (!property) return [];

    if (property.type === "multi_select") {
      const multiSelectProp = property as NotionMultiSelectProperty;
      return multiSelectProp.multi_select.map((item) => item.name);
    }

    return [];
  }

  private getUrl(property: NotionPropertyValue | undefined): string | undefined {
    if (!property) return undefined;

    if (property.type === "url") {
      const urlProp = property as NotionUrlProperty;
      return urlProp.url || undefined;
    }

    return undefined;
  }

  private getDate(property: NotionPropertyValue | undefined): string {
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

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  private extractText(richText: NotionRichText[]): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => text.plain_text).join("");
  }

  private extractBlockContent(block: NotionBlockType): BlockContent {
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
          text: this.extractText(block.code.rich_text),
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
      case "image":
        return {
          type: "image" as const,
          url: block.image.external?.url || block.image.file?.url || "",
          caption: this.extractText(block.image.caption || []),
        };
      case "video":
        return {
          type: "image" as const, // video도 ImageContent 타입 사용
          url: block.video.external?.url || block.video.file?.url || "",
          caption: this.extractText(block.video.caption || []),
        };
      case "divider":
        return { type: "plain_text" as const, text: "" };
      default:
        // TypeScript exhaustiveness check - 모든 블록 타입이 처리됨
        const _exhaustiveCheck: never = block;
        console.log(`Unknown block type:`, _exhaustiveCheck);
        return { type: "plain_text" as const, text: "" };
    }
  }
}

// Singleton instance
export const notionClient = new NotionClient();
