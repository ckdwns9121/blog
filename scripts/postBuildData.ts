import type { BlogPost } from "../src/entities/post/model";
import type { ContentBlockWithChildren } from "../src/shared/types/content";

export interface PostBuildMetadata {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: Date | string;
  updatedAt: Date | string;
  tags: ReadonlyArray<{ name: string; slug: string; postCount?: number }>;
  coverImage?: string;
}

export type FullPostFetcher = (postId: string, fetchContent: true) => Promise<BlogPost>;

export interface PostBuildData {
  post: BlogPost;
  imageUrls: string[];
}

export function extractImageUrlsFromBlocks(blocks: readonly ContentBlockWithChildren[]): string[] {
  const imageUrls: string[] = [];

  for (const block of blocks) {
    if (block.type === "image" && block.url) {
      imageUrls.push(block.url);
    }

    if (block.children) {
      imageUrls.push(...extractImageUrlsFromBlocks(block.children));
    }
  }

  return imageUrls;
}

function normalizeMetadataDate(value: Date | string, field: string, postId: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Post ${postId} has an invalid ${field}`);
  }

  return date;
}

export async function collectPostBuildData(
  metadataPosts: readonly PostBuildMetadata[],
  fetchFullPost: FullPostFetcher,
): Promise<PostBuildData[]> {
  if (metadataPosts.length === 0) {
    throw new Error("Cannot build post data because no published posts were returned");
  }

  return Promise.all(
    metadataPosts.map(async (metadata) => {
      const fullPost = await fetchFullPost(metadata.id, true);
      if (fullPost.id !== metadata.id) {
        throw new Error(`Fetched post ${fullPost.id} did not match requested post ${metadata.id}`);
      }

      const post: BlogPost = {
        ...fullPost,
        title: metadata.title,
        slug: metadata.slug,
        excerpt: metadata.excerpt || "",
        publishedAt: normalizeMetadataDate(metadata.publishedAt, "publishedAt", metadata.id),
        updatedAt: normalizeMetadataDate(metadata.updatedAt, "updatedAt", metadata.id),
        tags: metadata.tags.map(({ name, slug, postCount = 0 }) => ({ name, slug, postCount })),
        coverImage: metadata.coverImage,
      };
      const imageUrls = [
        ...(post.coverImage ? [post.coverImage] : []),
        ...extractImageUrlsFromBlocks(post.content),
      ];

      return { post, imageUrls };
    }),
  );
}
