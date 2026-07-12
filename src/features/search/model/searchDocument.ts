import type { BlogPost, Tag } from "@/entities/post/model";
import { extractContentText } from "@/shared/utils/contentText";

export interface SearchDocument {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  tags: Tag[];
  coverImage?: string;
  searchText: string;
}

export type SearchablePost = BlogPost & { searchText: string };

const REQUIRED_DOCUMENT_KEYS = [
  "id",
  "title",
  "slug",
  "excerpt",
  "publishedAt",
  "updatedAt",
  "tags",
  "searchText",
] as const;
const OPTIONAL_DOCUMENT_KEYS = ["coverImage"] as const;
const TAG_KEYS = ["name", "slug", "postCount"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  path: string,
): void {
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  const unknownKey = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    throw new Error(`${path}.${unknownKey} is not a public search field`);
  }

  const missingKey = requiredKeys.find((key) => !(key in value));
  if (missingKey) {
    throw new Error(`${path}.${missingKey} is required`);
  }
}

function assertString(value: unknown, path: string, allowEmpty = true): asserts value is string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw new Error(`${path} must be ${allowEmpty ? "a string" : "a non-empty string"}`);
  }
}

function assertIsoDate(value: unknown, path: string): asserts value is string {
  assertString(value, path, false);

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw new Error(`${path} must be an ISO date string`);
  }
}

function parseTag(value: unknown, path: string): Tag {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  assertExactKeys(value, TAG_KEYS, [], path);
  assertString(value.name, `${path}.name`, false);
  assertString(value.slug, `${path}.slug`, false);

  if (!Number.isInteger(value.postCount) || (value.postCount as number) < 0) {
    throw new Error(`${path}.postCount must be a non-negative integer`);
  }

  return {
    name: value.name,
    slug: value.slug,
    postCount: value.postCount as number,
  };
}

function parseSearchDocument(value: unknown, index: number): SearchDocument {
  const path = `search documents[${index}]`;
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  assertExactKeys(value, REQUIRED_DOCUMENT_KEYS, OPTIONAL_DOCUMENT_KEYS, path);
  assertString(value.id, `${path}.id`, false);
  assertString(value.title, `${path}.title`, false);
  assertString(value.slug, `${path}.slug`, false);
  assertString(value.excerpt, `${path}.excerpt`);
  assertIsoDate(value.publishedAt, `${path}.publishedAt`);
  assertIsoDate(value.updatedAt, `${path}.updatedAt`);
  assertString(value.searchText, `${path}.searchText`);

  if (!Array.isArray(value.tags)) {
    throw new Error(`${path}.tags must be an array`);
  }

  if (value.coverImage !== undefined) {
    assertString(value.coverImage, `${path}.coverImage`, false);
  }

  return {
    id: value.id,
    title: value.title,
    slug: value.slug,
    excerpt: value.excerpt,
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
    tags: value.tags.map((tag, tagIndex) => parseTag(tag, `${path}.tags[${tagIndex}]`)),
    ...(value.coverImage ? { coverImage: value.coverImage } : {}),
    searchText: value.searchText,
  };
}

function serializeDate(value: Date, field: "publishedAt" | "updatedAt", postId: string): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Post ${postId} has an invalid ${field}`);
  }

  return value.toISOString();
}

export function createSearchDocument(post: BlogPost): SearchDocument {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    publishedAt: serializeDate(post.publishedAt, "publishedAt", post.id),
    updatedAt: serializeDate(post.updatedAt, "updatedAt", post.id),
    tags: post.tags.map(({ name, slug, postCount }) => ({ name, slug, postCount })),
    ...(post.coverImage ? { coverImage: post.coverImage } : {}),
    searchText: extractContentText(post.content),
  };
}

export function createSearchDocuments(posts: readonly BlogPost[]): SearchDocument[] {
  return posts.map(createSearchDocument);
}

export function parseSearchDocuments(payload: unknown): SearchDocument[] {
  if (!Array.isArray(payload)) {
    throw new Error("Search index payload must be an array");
  }

  return payload.map(parseSearchDocument);
}

export function hydrateSearchDocument(document: SearchDocument): SearchablePost {
  return {
    ...document,
    publishedAt: new Date(document.publishedAt),
    updatedAt: new Date(document.updatedAt),
    content: [],
    toc: [],
  };
}

export function hydrateSearchDocuments(payload: unknown): SearchablePost[] {
  return parseSearchDocuments(payload).map(hydrateSearchDocument);
}
