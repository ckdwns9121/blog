// Notion Database에서 가져오는 데이터 구조
export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  excerpt?: string;
  coverImage?: string;
  readingTime?: number;
}

// Notion API 응답 타입들
export interface NotionRichText {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

export interface NotionProperty {
  id: string;
  type: string;
}

export interface NotionTitleProperty extends NotionProperty {
  type: "title";
  title: NotionRichText[];
}

export interface NotionRichTextProperty extends NotionProperty {
  type: "rich_text";
  rich_text: NotionRichText[];
}

export interface NotionCheckboxProperty extends NotionProperty {
  type: "checkbox";
  checkbox: boolean;
}

export interface NotionSelectProperty extends NotionProperty {
  type: "select";
  select: { name: string } | null;
}

export interface NotionMultiSelectProperty extends NotionProperty {
  type: "multi_select";
  multi_select: Array<{ name: string }>;
}

export interface NotionDateProperty extends NotionProperty {
  type: "date";
  date: { start: string; end?: string } | null;
}

export interface NotionUrlProperty extends NotionProperty {
  type: "url";
  url: string | null;
}

export interface NotionNumberProperty extends NotionProperty {
  type: "number";
  number: number | null;
}

export interface NotionFileProperty extends NotionProperty {
  type: "files";
  files: Array<{
    name: string;
    type?: "external" | "file";
    external?: { url: string };
    file?: { url: string; expiry_time: string };
  }>;
}

export type NotionPropertyValue =
  | NotionTitleProperty
  | NotionRichTextProperty
  | NotionCheckboxProperty
  | NotionSelectProperty
  | NotionMultiSelectProperty
  | NotionDateProperty
  | NotionUrlProperty
  | NotionNumberProperty
  | NotionFileProperty;

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, NotionPropertyValue>;
}

export interface NotionBlockBase {
  object: "block";
  id: string;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
}

export interface NotionParagraphBlock extends NotionBlockBase {
  type: "paragraph";
  paragraph: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionHeading1Block extends NotionBlockBase {
  type: "heading_1";
  heading_1: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionHeading2Block extends NotionBlockBase {
  type: "heading_2";
  heading_2: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionHeading3Block extends NotionBlockBase {
  type: "heading_3";
  heading_3: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionBulletedListItemBlock extends NotionBlockBase {
  type: "bulleted_list_item";
  bulleted_list_item: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionNumberedListItemBlock extends NotionBlockBase {
  type: "numbered_list_item";
  numbered_list_item: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionCodeBlock extends NotionBlockBase {
  type: "code";
  code: {
    rich_text: NotionRichText[];
    language: string;
    caption?: NotionRichText[];
  };
}

export interface NotionQuoteBlock extends NotionBlockBase {
  type: "quote";
  quote: {
    rich_text: NotionRichText[];
    color?: string;
  };
}

export interface NotionImageBlock extends NotionBlockBase {
  type: "image";
  image: {
    type: "external" | "file";
    external?: { url: string };
    file?: { url: string; expiry_time: string };
    caption?: NotionRichText[];
  };
}

export interface NotionVideoBlock extends NotionBlockBase {
  type: "video";
  video: {
    type: "external" | "file";
    external?: { url: string };
    file?: { url: string; expiry_time: string };
    caption?: NotionRichText[];
  };
}

export interface NotionDividerBlock extends NotionBlockBase {
  type: "divider";
  divider: Record<string, never>;
}

export interface NotionBookmarkBlock extends NotionBlockBase {
  type: "bookmark";
  bookmark: {
    url: string;
    caption?: NotionRichText[];
  };
}

export type NotionBlockType =
  | NotionParagraphBlock
  | NotionHeading1Block
  | NotionHeading2Block
  | NotionHeading3Block
  | NotionBulletedListItemBlock
  | NotionNumberedListItemBlock
  | NotionCodeBlock
  | NotionQuoteBlock
  | NotionImageBlock
  | NotionVideoBlock
  | NotionDividerBlock
  | NotionBookmarkBlock;

// Notion 블록의 content 타입들
export interface RichTextItem {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

// Discriminated Union으로 타입 안정성 강화
export type TextContent =
  | { type: "rich_text"; rich_text: RichTextItem[] }
  | { type: "plain_text"; text: string }
  | { type: "title"; title: RichTextItem[] }
  // 레거시 지원 (타입 필드 없는 경우)
  | { text?: string; rich_text?: RichTextItem[]; title?: RichTextItem[] };

export interface CodeContent {
  type: "code";
  text?: string;
  rich_text?: RichTextItem[];
  language?: string;
}

export interface ImageContent {
  type: "image";
  url: string;
  caption?: string;
}

export interface BookmarkContent {
  type: "bookmark";
  url: string;
  caption?: string;
}

export type BlockContent = string | TextContent | CodeContent | ImageContent | BookmarkContent;

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
