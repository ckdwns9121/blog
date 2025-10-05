// Notion Database에서 가져오는 데이터 구조
export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  excerpt?: string;
  coverImage?: string;
  readingTime?: number;
}

// Notion 블록의 content 타입들
export interface RichTextItem {
  plain_text: string;
  href?: string;
}

export interface TextContent {
  text?: string;
  rich_text?: RichTextItem[];
  title?: RichTextItem[];
}

export interface CodeContent extends TextContent {
  language?: string;
}

export interface ImageContent {
  url: string;
  caption?: string;
}

export type BlockContent = string | TextContent | CodeContent | ImageContent;

export interface NotionBlock {
  id: string;
  type: string;
  content: BlockContent;
  children?: NotionBlock[];
}

// 애플리케이션에서 사용하는 데이터 구조
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: NotionBlock[]; // 블록 형태로 변경
  excerpt: string;
  publishedAt: Date;
  updatedAt: Date;
  category: Category;
  tags: Tag[];
  coverImage?: string;
  readingTime: number;
  toc: TableOfContentsItem[];
}

export interface Category {
  name: string;
  slug: string;
  postCount: number;
}

export interface Tag {
  name: string;
  slug: string;
  postCount: number;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}
