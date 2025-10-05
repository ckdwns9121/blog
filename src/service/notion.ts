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
  BlockContent,
} from "../types/notion";

export class NotionClient {
  private client?: Client;
  private databaseId: string;
  private useRealAPI: boolean;

  constructor() {
    // 환경 변수 확인
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!dbId) {
      throw new Error("NOTION_DATABASE_ID is required. Please set it in .env.local");
    }

    this.databaseId = dbId;
    this.useRealAPI = !!apiKey;

    // API 키가 있으면 실제 클라이언트 초기화
    if (this.useRealAPI) {
      this.client = new Client({
        auth: apiKey,
        // Notion 클라이언트 로깅 비활성화
        logLevel: process.env.NODE_ENV === "production" ? undefined : undefined,
      });
      console.log("✓ Notion API connected");
    } else {
      console.log("⚠ Using Mock data mode. Set NOTION_API_KEY in .env.local for real Notion API integration.");
    }
  }

  // Rate limiting 구현
  private async rateLimitCheck() {
    // 초당 3 requests 제한 준수
    await new Promise((resolve) => setTimeout(resolve, 334));
  }

  // 포스트 메타데이터 조회
  async getAllPosts(): Promise<NotionPost[]> {
    if (!this.useRealAPI || !this.client) {
      return this.getFallbackPosts();
    }

    try {
      await this.rateLimitCheck();

      // 모든 페이지 검색 (권한이 있는 모든 페이지)
      const response = await this.client.search({
        query: "",
        page_size: 100,
      });

      // 결과를 페이지별로 처리하여 포스트 데이터 추출
      const posts: NotionPost[] = [];

      for (const page of response.results.slice(0, 50)) {
        // 최대 50개로 제한
        try {
          // 각 페이지의 속성 가져오기
          const pageData = await this.client.pages.retrieve({
            page_id: page.id,
          });

          // 페이지 데이터 처리
          if (pageData.object === "page") {
            const notionPage = pageData as NotionPage;
            const properties = notionPage.properties;

            // 발행된 포스트만 필터링
            const publishedProperty = properties.published as NotionCheckboxProperty | undefined;
            const titleProperty = this.getPlainText(properties.title);

            if (publishedProperty?.checkbox && titleProperty) {
              const originalSlug = this.getPlainText(properties.slug);
              const generatedSlug = this.slugify(titleProperty);
              const finalSlug = originalSlug || generatedSlug;

              // slug가 비어있으면 기본값 사용
              const validSlug = finalSlug || `post-${notionPage.id.slice(-8)}`;

              const readingTimeProperty = properties.readingTime as NotionNumberProperty | undefined;

              posts.push({
                id: notionPage.id,
                title: titleProperty,
                slug: validSlug,
                published: publishedProperty.checkbox,
                createdAt: notionPage.created_time || new Date().toISOString(),
                updatedAt: notionPage.last_edited_time || new Date().toISOString(),
                category: this.getPlainText(properties.category) || "기타",
                tags: this.getMultiSelect(properties.tags) || [],
                excerpt: this.getPlainText(properties.excerpt),
                coverImage: this.getUrl(properties.coverImage),
                readingTime: readingTimeProperty?.number || 0,
              });
            }
          }
        } catch (pageError) {
          // 권한 없는 페이지나 삭제된 페이지는 조용히 건너뛰기
          const error = pageError as Error & { code?: string };
          if (error.code === "object_not_found") {
            // 프로덕션에서는 간단한 로그만
            console.log(`⚠ Skipping inaccessible page: ${page.id}`);
          } else {
            console.warn(`Failed to process page ${page.id}:`, error.message);
          }
        }
      }

      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error fetching posts from Notion:", error);
      console.log("Fallback to Mock data due to API error");

      return this.getFallbackPosts();
    }
  }

  // 특정 포스트 상세 조회
  async getPostBySlug(slug: string): Promise<BlogPost> {
    if (!this.useRealAPI || !this.client) {
      const fallbackPosts = this.getFallbackPosts();
      const fallbackPost = fallbackPosts.find((p) => p.slug === slug);

      if (!fallbackPost) {
        throw new Error(`Post with slug "${slug}" not found`);
      }

      return this.convertToBlogPost(fallbackPost);
    }

    try {
      await this.rateLimitCheck();

      const posts = await this.getAllPosts();
      const decodedSlug = decodeURIComponent(slug);
      const post = posts.find((p) => p.slug === decodedSlug || p.slug === slug);

      if (!post) {
        throw new Error(`Post with slug "${slug}" not found`);
      }

      // 포스트 콘텐츠 가져오기 (블록 형태)
      const blocks = await this.getPostBlocks(post.id);

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: blocks,
        excerpt: post.excerpt || "",
        publishedAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        category: {
          name: post.category,
          slug: this.slugify(post.category),
          postCount: 0, // TODO: Implement count calculation
        },
        tags: (post.tags || []).map((tag) => ({
          name: tag,
          slug: this.slugify(tag),
          postCount: 0, // TODO: Implement count calculation
        })),
        coverImage: post.coverImage,
        readingTime: post.readingTime || 0,
        toc: [], // TODO: Implement TOC generation
      };
    } catch (error) {
      console.error("Error fetching post by slug:", error);

      // 폴백 시도
      const fallbackPosts = this.getFallbackPosts();
      const fallbackPost = fallbackPosts.find((p) => p.slug === slug);

      if (fallbackPost) {
        return this.convertToBlogPost(fallbackPost);
      }

      throw new Error(`Failed to fetch post with slug "${slug}"`);
    }
  }

  // 포스트 콘텐츠 변환 (블록 형태로)
  async getPostBlocks(pageId: string): Promise<NotionBlock[]> {
    if (!this.useRealAPI || !this.client) {
      return [
        {
          id: "fallback-1",
          type: "heading_1",
          content: { text: "Default Content" },
        },
        {
          id: "fallback-2",
          type: "paragraph",
          content: { text: `This is fallback content for page ${pageId}.` },
        },
      ];
    }

    try {
      await this.rateLimitCheck();

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
          children: notionBlock.has_children ? [] : undefined, // TODO: Implement nested blocks
        };
      });
    } catch (error) {
      console.error("Error fetching post blocks:", error);
      return [
        {
          id: "error-1",
          type: "heading_1",
          content: { text: "Content Error" },
        },
        {
          id: "error-2",
          type: "paragraph",
          content: { text: "Unable to fetch content for this post." },
        },
      ];
    }
  }

  // 포스트 콘텐츠 변환 (마크다운 형태로)
  async getPostContent(pageId: string): Promise<string> {
    if (!this.useRealAPI || !this.client) {
      return `# Default Content\n\nThis is fallback content for page ${pageId}.`;
    }

    try {
      await this.rateLimitCheck();

      const response = await this.client.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      const blocks = response.results as NotionBlockType[];
      return this.convertBlocksToMarkdown(blocks);
    } catch (error) {
      console.error("Error fetching post content:", error);
      return `# Content Error\n\nUnable to fetch content for this post.`;
    }
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

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  // Notion 블록을 마크다운으로 변환
  private convertBlocksToMarkdown(blocks: NotionBlockType[]): string {
    let markdown = "";

    for (const block of blocks) {
      switch (block.type) {
        case "heading_1":
          markdown += `# ${this.extractText(block.heading_1.rich_text)}\n\n`;
          break;
        case "heading_2":
          markdown += `## ${this.extractText(block.heading_2.rich_text)}\n\n`;
          break;
        case "heading_3":
          markdown += `### ${this.extractText(block.heading_3.rich_text)}\n\n`;
          break;
        case "paragraph":
          markdown += `${this.extractText(block.paragraph.rich_text)}\n\n`;
          break;
        case "bulleted_list_item":
          markdown += `- ${this.extractText(block.bulleted_list_item.rich_text)}\n`;
          break;
        case "numbered_list_item":
          markdown += `1. ${this.extractText(block.numbered_list_item.rich_text)}\n`;
          break;
        case "code":
          markdown += `\`\`\`${block.code.language}\n${this.extractText(block.code.rich_text)}\n\`\`\`\n\n`;
          break;
        case "quote":
          markdown += `> ${this.extractText(block.quote.rich_text)}\n\n`;
          break;
        case "image":
          markdown += `![${this.extractText(block.image.caption || [])}](${
            block.image.external?.url || block.image.file?.url || ""
          })\n\n`;
          break;
        case "divider":
          markdown += `---\n\n`;
          break;
        default:
          // TypeScript exhaustiveness check - 이 코드는 실행되지 않아야 함
          const _exhaustiveCheck: never = block;
          console.log(`Unknown block type:`, _exhaustiveCheck);
      }
    }

    return markdown.trim();
  }

  private extractText(richText: NotionRichText[]): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => text.plain_text).join("");
  }

  private extractBlockContent(block: NotionBlockType): BlockContent {
    switch (block.type) {
      case "heading_1":
        return { text: this.extractText(block.heading_1.rich_text) };
      case "heading_2":
        return { text: this.extractText(block.heading_2.rich_text) };
      case "heading_3":
        return { text: this.extractText(block.heading_3.rich_text) };
      case "paragraph":
        return { text: this.extractText(block.paragraph.rich_text) };
      case "bulleted_list_item":
        return { text: this.extractText(block.bulleted_list_item.rich_text) };
      case "numbered_list_item":
        return { text: this.extractText(block.numbered_list_item.rich_text) };
      case "code":
        return {
          text: this.extractText(block.code.rich_text),
          language: block.code.language,
        };
      case "quote":
        return { text: this.extractText(block.quote.rich_text) };
      case "image":
        return {
          url: block.image.external?.url || block.image.file?.url || "",
          caption: this.extractText(block.image.caption || []),
        };
      case "divider":
        return {};
      default:
        // TypeScript exhaustiveness check - 모든 블록 타입이 처리됨
        const _exhaustiveCheck: never = block;
        console.log(`Unknown block type:`, _exhaustiveCheck);
        return { text: "" };
    }
  }

  // 개발용 폴백 데이터
  private getFallbackPosts(): NotionPost[] {
    console.log("📄 Using fallback mock data");

    return [
      {
        id: "1",
        title: "첫 번째 블로그 포스트",
        slug: "first-post",
        published: true,
        createdAt: "2025-01-26T00:00:00.000Z",
        updatedAt: "2025-01-26T00:00:00.000Z",
        category: "JavaScript",
        tags: ["React", "Next.js"],
        excerpt: "이것은 첫 번째 블로그 포스트의 요약입니다. 실제 Notion API를 설정하면 실제 데이터를 볼 수 있습니다.",
        coverImage: undefined,
        readingTime: 5,
      },
      {
        id: "2",
        title: "두 번째 포스트",
        slug: "second-post",
        published: true,
        createdAt: "2025-01-25T00:00:00.000Z",
        updatedAt: "2025-01-25T00:00:00.000Z",
        category: "TypeScript",
        tags: ["개발", "학습"],
        excerpt: "TypeScript에 대해 알아봅시다. 이 포스트는 Mock 데이터입니다.",
        coverImage: undefined,
        readingTime: 8,
      },
      {
        id: "3",
        title: "Notion API 연동 가이드",
        slug: "notion-api-guide",
        published: true,
        createdAt: "2025-01-24T00:00:00.000Z",
        updatedAt: "2025-01-24T00:00:00.000Z",
        category: "가이드",
        tags: ["Notion", "API", "설정"],
        excerpt: "이 블로그에서 Notion을 CMS로 사용하는 방법을 설명합니다.",
        coverImage: undefined,
        readingTime: 12,
      },
      {
        id: "4",
        title: "네 번째 포스스트",
        slug: "fourth-post",
        published: true,
        createdAt: "2025-01-23T00:00:00.000Z",
        updatedAt: "2025-01-23T00:00:00.000Z",
        category: "CSS",
        tags: ["스타일", "디자인"],
        excerpt: "CSS의 멋진 기능들을 소개합니다. Mock 데이터로 생성된 포스트입니다.",
        coverImage: undefined,
        readingTime: 15,
      },
    ];
  }

  private convertToBlogPost(post: NotionPost): BlogPost {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: [
        {
          id: "fallback-title",
          type: "heading_1",
          content: { text: post.title },
        },
        {
          id: "fallback-content",
          type: "paragraph",
          content: {
            text: `이것은 ${post.title}의 내용입니다.\n\n${
              post.excerpt || ""
            }\n\n이 포스트는 Mock 데이터입니다. 실제 Notion API를 사용하려면 환경 변수를 설정해주세요.`,
          },
        },
      ],
      excerpt: post.excerpt || "",
      publishedAt: new Date(post.createdAt),
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

  // API 상태 확인 메서드
  getApiStatus(): { useRealAPI: boolean; message: string } {
    if (this.useRealAPI) {
      return {
        useRealAPI: true,
        message: "✅ Real Notion API 연결됨",
      };
    } else {
      return {
        useRealAPI: false,
        message: "⚠️ Mock 데이터 사용 중 (NOTION_API_KEY를 설정하세요)",
      };
    }
  }
}

// Singleton instance
export const notionClient = new NotionClient();
