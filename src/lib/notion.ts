import { Client } from "@notionhq/client";
import type { NotionPost, BlogPost } from "../types/notion";

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
      });
      console.log("✓ Real Notions API client initialized");
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
            const properties = (pageData as { properties: Record<string, unknown> }).properties;

            // 발행된 포스트만 필터링
            const publishedProperty = (properties as Record<string, unknown>)?.published as { checkbox?: boolean };
            const titleProperty = this.getPlainText((properties as Record<string, unknown>)?.title);

            // 디버깅 정보 추가
            console.log(`Page ${page.id}:`, {
              published: publishedProperty,
              title: titleProperty,
              properties: Object.keys(properties || {}),
            });

            if (publishedProperty?.checkbox && titleProperty) {
              const originalSlug = this.getPlainText((properties as Record<string, unknown>)?.slug);
              const generatedSlug = this.slugify(titleProperty);
              const finalSlug = originalSlug || generatedSlug;

              // slug가 비어있으면 기본값 사용
              const validSlug = finalSlug || `post-${pageData.id.slice(-8)}`;

              console.log("🔧 Creating post:", {
                title: titleProperty,
                originalSlug,
                generatedSlug,
                finalSlug,
                validSlug,
              });
              posts.push({
                id: pageData.id,
                title: titleProperty,
                slug: validSlug,
                published: publishedProperty.checkbox,
                createdAt:
                  (properties as any)?.createdAt?.date?.start || (page as any).created_time || new Date().toISOString(),
                updatedAt:
                  (properties as any)?.updatedAt?.date?.start ||
                  (page as any).last_edited_time ||
                  new Date().toISOString(),
                category: this.getPlainText((properties as Record<string, unknown>)?.category) || "기타",
                tags: this.getMultiSelect((properties as Record<string, unknown>)?.tags) || [],
                excerpt: this.getPlainText((properties as Record<string, unknown>)?.excerpt),
                coverImage: this.getUrl((properties as Record<string, unknown>)?.coverImage),
                readingTime: (properties as any)?.readingTime?.number || 0,
              });
            }
          }
        } catch (pageError) {
          console.warn(`Failed to process page ${page.id}:`, pageError);
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
      console.log(
        "🔍 Available posts:",
        posts.map((p) => ({ title: p.title, slug: p.slug }))
      );
      console.log("🔍 Searching for:", { originalSlug: slug, decodedSlug });
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
        content: blocks as any[], // 블록 형태로 변경
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
  async getPostBlocks(pageId: string): Promise<any[]> {
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

      return response.results.map((block: any) => ({
        id: block.id,
        type: block.type,
        content: this.extractBlockContent(block),
        children: block.has_children ? [] : undefined, // TODO: Implement nested blocks
      }));
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

      const blocks = response.results;
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
  private getPlainText(property: unknown): string {
    if (!property) return "";
    const prop = property as Record<string, unknown>;
    if (prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
      return (prop.rich_text[0] as { plain_text?: string }).plain_text || "";
    }
    if (prop.title && Array.isArray(prop.title) && prop.title.length > 0) {
      return (prop.title[0] as { plain_text?: string }).plain_text || "";
    }
    return "";
  }

  private getMultiSelect(property: unknown): string[] {
    if (!property) return [];
    const prop = property as Record<string, unknown>;
    if (prop.multi_select && Array.isArray(prop.multi_select)) {
      return prop.multi_select.map((item: { name: string }) => item.name);
    }
    return [];
  }

  private getUrl(property: unknown): string | undefined {
    if (!property) return undefined;
    const prop = property as Record<string, unknown>;
    if (prop.url) {
      return prop.url as string;
    }
    if (prop.external && typeof prop.external === "object") {
      const external = prop.external as Record<string, unknown>;
      if (external.url) return external.url as string;
    }
    if (prop.file && typeof prop.file === "object") {
      const file = prop.file as Record<string, unknown>;
      if (file.url) return file.url as string;
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
  private convertBlocksToMarkdown(blocks: any[]): string {
    let markdown = "";

    for (const block of blocks) {
      switch (block.type) {
        case "heading_1":
          markdown += `# ${this.extractText(block.heading_1?.rich_text || [])}\n\n`;
          break;
        case "heading_2":
          markdown += `## ${this.extractText(block.heading_2?.rich_text || [])}\n\n`;
          break;
        case "heading_3":
          markdown += `### ${this.extractText(block.heading_3?.rich_text || [])}\n\n`;
          break;
        case "paragraph":
          markdown += `${this.extractText(block.paragraph?.rich_text || [])}\n\n`;
          break;
        case "bulleted_list_item":
          markdown += `- ${this.extractText(block.bulleted_list_item?.rich_text || [])}\n`;
          break;
        case "numbered_list_item":
          markdown += `1. ${this.extractText(block.numbered_list_item?.rich_text || [])}\n`;
          break;
        case "code":
          markdown += `\`\`\`${block.code?.language || ""}\n${this.extractText(
            block.code?.rich_text || []
          )}\n\`\`\`\n\n`;
          break;
        case "quote":
          markdown += `> ${this.extractText(block.quote?.rich_text || [])}\n\n`;
          break;
        case "image":
          markdown += `![${this.extractText(block.image?.caption || [])}](${
            block.image?.external?.url || block.image?.file?.url || ""
          })\n\n`;
          break;
        // 추가 블록 타입들은 필요에 따라 구현
        default:
          // 알 수 없는 블록 타입에 대해서는 무시하거나 로그 출력
          console.log(`Unknown block type: ${block.type}`);
      }
    }

    return markdown.trim();
  }

  private extractText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((text) => (text as { plain_text?: string }).plain_text || "").join("");
  }

  private extractBlockContent(block: any): any {
    switch (block.type) {
      case "heading_1":
        return { text: this.extractText(block.heading_1?.rich_text || []) };
      case "heading_2":
        return { text: this.extractText(block.heading_2?.rich_text || []) };
      case "heading_3":
        return { text: this.extractText(block.heading_3?.rich_text || []) };
      case "paragraph":
        return { text: this.extractText(block.paragraph?.rich_text || []) };
      case "bulleted_list_item":
        return { text: this.extractText(block.bulleted_list_item?.rich_text || []) };
      case "numbered_list_item":
        return { text: this.extractText(block.numbered_list_item?.rich_text || []) };
      case "code":
        return {
          text: this.extractText(block.code?.rich_text || []),
          language: block.code?.language || "text",
        };
      case "quote":
        return { text: this.extractText(block.quote?.rich_text || []) };
      case "image":
        return {
          url: block.image?.external?.url || block.image?.file?.url || "",
          caption: this.extractText(block.image?.caption || []),
        };
      case "divider":
        return {};
      default:
        return { text: this.extractText(block[block.type]?.rich_text || []) };
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
