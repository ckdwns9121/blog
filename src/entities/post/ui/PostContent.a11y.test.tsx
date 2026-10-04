import { render, screen } from "@testing-library/react";
import type { ContentBlockWithChildren, RichTextItem } from "@/shared/types/content";
import PostContent from "./PostContent";
import { expectNoA11yViolations } from "@/test/a11y";

// react-syntax-highlighter 의 ESM 스타일 번들은 jest 가 변환하지 못한다.
// 코드 블록의 접근성은 CodeBlock 자체 테스트가 맡고, 여기서는 본문 조립만 본다.
jest.mock("@/features/notion/ui/blocks/CodeBlock", () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    <pre data-language={language}>
      <code>{code}</code>
    </pre>
  ),
}));

jest.mock("@/shared/utils/imageMapper", () => ({
  getOptimizedImageData: (url: string) => ({ src: url, width: 800, height: 600 }),
  getOptimizedImageUrl: (url: string) => url,
}));

const text = (plain_text: string, href?: string): RichTextItem[] => [{ plain_text, href }];

const blocks: ContentBlockWithChildren[] = [
  { id: "p1", type: "text", richText: text("첫 문단이다. ") },
  { id: "h2", type: "heading", level: 2, richText: text("첫 번째 절") },
  { id: "p2", type: "text", richText: [...text("링크가 들어간 문단: "), ...text("Next.js 문서", "https://nextjs.org")] },
  { id: "h3", type: "heading", level: 3, richText: text("세부 항목") },
  { id: "l1", type: "list_item", listType: "bulleted", richText: text("첫째") },
  { id: "l2", type: "list_item", listType: "bulleted", richText: text("둘째"), children: [
    { id: "l2a", type: "list_item", listType: "bulleted", richText: text("둘째의 하위") },
  ] },
  { id: "o1", type: "list_item", listType: "numbered", richText: text("하나") },
  { id: "o2", type: "list_item", listType: "numbered", richText: text("둘") },
  { id: "q", type: "quote", richText: text("인용문이다.") },
  { id: "c", type: "code", code: "const a = 1;", language: "typescript" },
  { id: "img", type: "image", url: "/images/sample/diagram.webp", caption: "요청 흐름 다이어그램" },
  { id: "img2", type: "image", url: "/images/sample/decoration.webp" },
  { id: "d", type: "divider" },
  { id: "b", type: "bookmark", url: "https://vercel.com/docs/caching", caption: "Vercel 캐시 문서" },
  {
    id: "t",
    type: "table",
    hasColumnHeader: true,
    rows: [
      { type: "table_row", cells: [{ richText: text("상태") }, { richText: text("뜻") }] },
      { type: "table_row", cells: [{ richText: text("HIT") }, { richText: text("캐시에서 나옴") }] },
    ],
  } as ContentBlockWithChildren,
  { id: "h1", type: "heading", level: 1, richText: text("본문 h1 은 h2 로 내려간다") },
];

describe("PostContent accessibility", () => {
  it("renders every block type without axe violations", async () => {
    const { container } = render(<PostContent blocks={blocks} />);

    // 글 제목이 페이지의 h1 이므로 본문 헤딩은 h2 부터 시작해야 한다.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    // 표 머리글은 th 로 노출되어야 한다.
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    // 새 탭으로 여는 링크는 그 사실을 읽어 줘야 한다.
    expect(screen.getByRole("link", { name: /Vercel 캐시 문서|vercel\.com/ })).toHaveAccessibleName(/새 탭에서 열림/);

    await expectNoA11yViolations(container);
  });
});
