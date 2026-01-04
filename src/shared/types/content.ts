/**
 * 공통 콘텐츠 블록 타입
 *
 * 이 타입은 CMS에 독립적인 공통 블록 구조를 정의합니다.
 * Notion, MDX, GitHub 등 다양한 CMS에서 이 타입으로 변환할 수 있습니다.
 */

/**
 * 리치 텍스트 아이템 (볼드, 이탤릭, 링크 등 스타일 정보 포함)
 */
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

/**
 * 텍스트 블록 (paragraph, quote 등)
 */
export interface TextBlock {
  type: "text";
  richText: RichTextItem[];
  fallbackText: string;
}

/**
 * 헤딩 블록
 */
export interface HeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  richText: RichTextItem[];
  fallbackText: string;
}

/**
 * 코드 블록
 */
export interface CodeBlock {
  type: "code";
  code: string;
  language: string;
}

/**
 * 이미지 블록
 */
export interface ImageBlock {
  type: "image";
  url: string;
  caption?: string;
}

/**
 * 비디오 블록
 */
export interface VideoBlock {
  type: "video";
  url: string;
  caption?: string;
}

/**
 * 인용 블록
 */
export interface QuoteBlock {
  type: "quote";
  richText: RichTextItem[];
  fallbackText: string;
}

/**
 * 리스트 아이템 블록
 */
export interface ListItemBlock {
  type: "list_item";
  listType: "bulleted" | "numbered";
  richText: RichTextItem[];
  fallbackText: string;
}

/**
 * 구분선 블록
 */
export interface DividerBlock {
  type: "divider";
}

/**
 * 북마크 블록
 */
export interface BookmarkBlock {
  type: "bookmark";
  url: string;
  caption?: string;
}

/**
 * 테이블 셀 타입
 */
export interface TableCell {
  richText: RichTextItem[];
  fallbackText: string;
}

/**
 * 테이블 행 타입
 */
export interface TableRow {
  type: "table_row";
  cells: TableCell[];
  isHeader?: boolean;
}

/**
 * 테이블 블록
 */
export interface TableBlock {
  type: "table";
  rows: TableRow[];
  hasColumnHeader: boolean;
  hasRowHeader: boolean;
}

/**
 * 공통 콘텐츠 블록 타입
 * 다양한 CMS에서 변환 가능한 표준 블록 구조
 */
export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | CodeBlock
  | ImageBlock
  | VideoBlock
  | QuoteBlock
  | ListItemBlock
  | DividerBlock
  | BookmarkBlock
  | TableBlock;

/**
 * 중첩 가능한 콘텐츠 블록 (children 포함)
 */
export interface ContentBlockWithChildren {
  id: string;
  type: ContentBlock["type"];
  // 각 블록 타입별 속성들을 union으로 정의
  richText?: RichTextItem[];
  fallbackText?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  code?: string;
  language?: string;
  url?: string;
  caption?: string;
  listType?: "bulleted" | "numbered";
  children?: ContentBlockWithChildren[];
  // Table-related properties
  rows?: TableRow[];
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
}
