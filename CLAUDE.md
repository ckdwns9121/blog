# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15** based personal tech blog that uses **Notion as a CMS**. The blog implements **SSG (Static Site Generation)** with optimized image handling, a plugin-based header system, and a CMS-agnostic content architecture.

## Key Commands

### Development

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production (includes image optimization)
- `pnpm build:images` - Run image optimization only
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Testing

- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run tests in watch mode

### Build Process

The build process consists of two main steps:

1. **Image Build** (`pnpm build:images`): Downloads and optimizes images from Notion
2. **Next.js Build** (`next build`): Generates static pages

## Architecture

### Content Management

- **Notion API** is used as the headless CMS
- All content is fetched from Notion during build time
- Images are downloaded and stored locally to avoid Notion's URL expiration issues
- The `buildImages.ts` script handles image optimization and mapping

### Key Directories

```
src/
├── app/              # Next.js 15 app router (pages, layouts)
├── entities/         # Domain entities (posts, tags) - CMS-agnostic models
├── features/         # Feature modules (notion, search, page-views)
├── shared/           # Shared UI, types, utilities
│   ├── ui/           # Reusable components (Header, Button, etc.)
│   ├── types/        # Generic content types (CMS-agnostic)
│   └── lib/          # Utility functions
└── widgets/          # Complex composed components
```

- `src/features/notion/` - Notion API integration, block rendering, and content adaptation
- `src/entities/` - Domain entities - **CMS-agnostic models** (no Notion-specific code)
- `src/shared/` - Shared utilities, types, and UI components
- `src/widgets/` - Complex UI components (post navigation)
- `scripts/` - Build scripts for image processing

### Image Handling

- Images from Notion S3 are converted to public URLs using Notion's image proxy
- Images are optimized and stored in `public/images/[post-slug]/`
- A mapping file `public/images/image-mapping.json` tracks URL transformations
- The image build script supports incremental builds to avoid re-downloading existing images

### Content Rendering

- Notion blocks are adapted to generic content blocks via `blockAdapter.ts`
- **CMS-Agnostic Types**: `src/shared/types/content.ts` defines generic block types (TextBlock, HeadingBlock, CodeBlock, etc.)
- Rich text is rendered with proper styling and annotations
- Code blocks support syntax highlighting
- Table of contents is generated from heading blocks

### State Management

- **React Query** (`@tanstack/react-query`) for server state
- React hooks for local state management
- Theme support via `next-themes`

### SEO & Performance

- Static generation with ISR support
- RSS feeds (`/atom.xml`, `/feed.json`, `/feed.xml`)
- Sitemap generation
- Open Graph images for posts
- Image optimization with WebP/AVIF formats

## Development Guidelines

### Environment Variables

Required environment variables:

- `NOTION_API_KEY` - Your Notion integration token
- `REDIS_URL` - For caching (optional but recommended)

### Content Structure in Notion

Posts should have these properties:

- `title` (title) - Post title
- `published` (checkbox) - Whether the post is published
- `publishedAt` (date) - Publication date
- `tags` (multi-select) - Post tags
- `excerpt` (rich text) - Post excerpt
- `coverImage` (url) - Cover image URL
- `slug` (rich text) - Custom slug (optional, auto-generated if not provided)

### Image URLs

The blog handles Notion's S3 URL expiration by:

1. Converting S3 URLs to Notion's public image proxy URLs
2. Downloading and optimizing images during build
3. Serving images locally from the public directory

### Adding New Features

When adding new Notion block types:

1. Update the type definitions in `src/features/notion/types/`
2. Add rendering logic in `src/features/notion/ui/blocks/`
3. Update the block adapter and mapper utilities
4. Add corresponding CSS styles if needed

When adding header plugins:

1. Create a plugin factory function returning a `HeaderPlugin` object:
   ```typescript
   import { HeaderPlugin } from "@/shared/ui/Header/types";

   export const createMyPlugin = (): HeaderPlugin => ({
     id: "my-plugin",
     name: "My Plugin",
     position: "right",  // "left" | "center" | "right"
     priority: 10,       // higher = rendered first
     render: () => <MyComponent />,
   });
   ```
2. Register the plugin in `src/app/ClientLayout.tsx`
3. The `HeaderSection` component automatically sorts and renders plugins by position

## Important Implementation Details

### Image Optimization Pipeline

- Images are processed in parallel during build using the `buildImages.ts` script
- The script supports incremental builds - only new or missing images are downloaded
- Images are converted to WebP format with configurable quality (default: 85)
- Each post gets its own image folder: `public/images/[post-slug]/`
- A mapping file tracks original URLs to local paths for runtime lookup

### URL Structure

- Post slugs include the page ID to ensure uniqueness: `[title]-[page-id]`
- The page ID has hyphens removed to create URL-friendly strings
- This structure allows for easy page ID extraction when fetching posts

### Caching Strategy

- React Query handles client-side caching of fetched data
- Redis is used for server-side caching (view counts, etc.)
- Static assets have long cache headers (1 year for images)

### Performance Optimizations

- API calls to Notion are made in parallel where possible
- Block fetching uses pagination (100 blocks per request)
- Image optimization happens during build time, not runtime
- SSG ensures all pages are pre-rendered at build time

### Key Architectural Patterns

**Adapter Pattern**: The Notion adapter (`src/features/notion/utils/blockAdapter.ts`) converts Notion-specific blocks to generic `ContentBlock` types defined in `src/shared/types/content.ts`. This enables switching CMSes without changing entity models.

**Plugin System**: Header uses a plugin-based architecture for extensibility. Plugins define position (left/center/right), priority, and render function. Registered in `ClientLayout.tsx` and rendered by `HeaderSection.tsx`.

**Entity-Feature Separation**: Entities (`src/entities/`) define domain models and are CMS-agnostic. Features (`src/features/`) implement capabilities like Notion integration, adapting data to the shared content model.
