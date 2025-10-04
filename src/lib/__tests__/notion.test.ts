// NotionClient API 테스트
import { NotionClient } from "../lib/notion";

describe("NotionClient", () => {
  let notionClient: NotionClient;

  beforeEach(() => {
    // 환경 변수 설정
    process.env.NOTION_DATABASE_ID = "test-database-id";

    notionClient = new NotionClient();
  });

  afterEach(() => {
    delete process.env.NOTION_DATABASE_ID;
  });

  describe("생성자", () => {
    it("환경 변수가 없을 때 에러를 발생시켜야 한다", () => {
      delete process.env.NOTION_DATABASE_ID;

      expect(() => new NotionClient()).toThrow("NOTION_DATABASE_ID is required");
    });
  });

  describe("getAllPosts", () => {
    it("공개된 포스트 목록을 가져와야 한다", async () => {
      const posts = await notionClient.getAllPosts();

      expect(posts).toHaveLength(3);
      expect(posts[0].title).toBe("첫 번째 블로그 포스트");
      expect(posts[0].slug).toBe("first-post");
      expect(posts[0].published).toBe(true);
    });
  });

  describe("getPostBySlug", () => {
    it("주어진 slug로 포스트를 찾아야 한다", async () => {
      const post = await notionClient.getPostBySlug("first-post");

      expect(post.title).toBe("첫 번째 블로그 포스트");
      expect(post.slug).toBe("first-post");
      expect(post.category.name).toBe("JavaScript");
    });

    it("slug로 포스트를 찾지 못하면 에러를 발생시켜야 한다", async () => {
      await expect(notionClient.getPostBySlug("non-existent")).rejects.toThrow(
        'Post with slug "non-existent" not found'
      );
    });
  });

  describe("getCategories", () => {
    it("카테고리 목록을 반환해야 한다", async () => {
      const categories = await notionClient.getCategories();

      expect(categories).toContain("JavaScript");
      expect(categories).toContain("TypeScript");
      expect(categories).toContain("CSS");
    });
  });
});
