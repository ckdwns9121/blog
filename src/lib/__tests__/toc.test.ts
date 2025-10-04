import { generateTableOfContents, organizeTocHierarchy, filterTocByLevel } from "../../lib/toc";
import type { NotionBlock, TableOfContentsItem } from "../../types/notion";

describe("TOC Generation", () => {
  const mockBlocks: NotionBlock[] = [
    {
      id: "1",
      type: "heading_1",
      content: { text: "제목 1" },
    },
    {
      id: "2",
      type: "paragraph",
      content: { text: "문단" },
    },
    {
      id: "3",
      type: "heading_2",
      content: { text: "제목 2" },
    },
    {
      id: "4",
      type: "heading_3",
      content: { text: "제목 3" },
    },
    {
      id: "5",
      type: "heading_2",
      content: { text: "제목 4" },
    },
    {
      id: "6",
      type: "heading_1",
      content: { text: "제목 5" },
    },
  ];

  it("헤딩 블록에서 목차를 생성한다", () => {
    const toc = generateTableOfContents(mockBlocks);

    expect(toc).toHaveLength(5);
    expect(toc[0]).toEqual({
      id: "heading-1",
      title: "제목 1",
      level: 1,
    });
    expect(toc[1]).toEqual({
      id: "heading-2",
      title: "제목 2",
      level: 2,
    });
    expect(toc[2]).toEqual({
      id: "heading-3",
      title: "제목 3",
      level: 3,
    });
  });

  it("빈 블록 배열에서 빈 목차를 반환한다", () => {
    const toc = generateTableOfContents([]);
    expect(toc).toHaveLength(0);
  });

  it("헤딩이 없는 블록에서 빈 목차를 반환한다", () => {
    const nonHeadingBlocks: NotionBlock[] = [
      {
        id: "1",
        type: "paragraph",
        content: { text: "문단" },
      },
      {
        id: "2",
        type: "code",
        content: { text: "코드" },
      },
    ];

    const toc = generateTableOfContents(nonHeadingBlocks);
    expect(toc).toHaveLength(0);
  });

  it("목차를 계층 구조로 정리한다", () => {
    const toc: TableOfContentsItem[] = [
      { id: "1", title: "제목 1", level: 1 },
      { id: "2", title: "제목 2", level: 2 },
      { id: "3", title: "제목 3", level: 3 },
      { id: "4", title: "제목 4", level: 2 },
      { id: "5", title: "제목 5", level: 1 },
    ];

    const organized = organizeTocHierarchy(toc);
    expect(organized).toEqual(toc); // 현재는 단순히 반환만 함
  });

  it("특정 레벨까지만 필터링한다", () => {
    const toc: TableOfContentsItem[] = [
      { id: "1", title: "제목 1", level: 1 },
      { id: "2", title: "제목 2", level: 2 },
      { id: "3", title: "제목 3", level: 3 },
      { id: "4", title: "제목 4", level: 4 },
    ];

    const filtered = filterTocByLevel(toc, 2);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].level).toBe(1);
    expect(filtered[1].level).toBe(2);
  });

  it("레벨 1만 필터링한다", () => {
    const toc: TableOfContentsItem[] = [
      { id: "1", title: "제목 1", level: 1 },
      { id: "2", title: "제목 2", level: 2 },
      { id: "3", title: "제목 3", level: 3 },
    ];

    const filtered = filterTocByLevel(toc, 1);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].level).toBe(1);
  });
});
