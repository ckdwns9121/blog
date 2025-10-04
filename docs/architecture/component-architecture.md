# 컴포넌트 아키텍처

## 프론트엔드 컴포넌트 구조

```mermaid
graph TD
    subgraph "App Router 구조"
        Layout[app/layout.tsx]
        HomePage[app/page.tsx]
        PostPage[app/posts/[slug]/page.tsx]
        CategoryPage[app/category/[category]/page.tsx]
        AboutPage[app/about/page.tsx]

        Layout --> HomePage
        Layout --> PostPage
        Layout --> CategoryPage
        Layout --> AboutPage
    end

    subgraph "공통 컴포넌트"
        Header[components/Header.tsx]
        Footer[components/Footer.tsx]
        ThemeToggle[components/ThemeToggle.tsx]
        PostCard[components/PostCard.tsx]
        PostContent[components/PostContent.tsx]

        Layout --> Header
        Layout --> Footer
        Header --> ThemeToggle
        HomePage --> PostCard
        PostPage --> PostContent
    end

    subgraph "유틸리티 레이어"
        NotionClient[lib/notion.ts]
        MarkdownParser[lib/markdown.ts]
        ThemeManager[lib/themes.ts]
        Utils[lib/utils.ts]

        PostPage --> NotionClient
        PostContent --> MarkdownParser
        ThemeToggle --> ThemeManager
    end
```

## 데이터 모델 설계

### Notion Database 스키마

```typescript
interface NotionPost {
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

interface NotionBlock {
  id: string;
  type: string;
  content: any;
  children?: NotionBlock[];
}
```

### 애플리케이션 데이터 타입

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: Date;
  updatedAt: Date;
  category: Category;
  tags: Tag[];
  coverImage?: string;
  readingTime: number;
  toc: TableOfContentsItem[];
}

interface Category {
  name: string;
  slug: string;
  postCount: number;
}

interface Tag {
  name: string;
  slug: string;
  postCount: number;
}
```
