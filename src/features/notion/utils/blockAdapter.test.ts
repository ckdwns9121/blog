import { adaptNotionBlockToContentBlock } from "./blockAdapter";
import type { NotionBlock } from "../types";

describe("adaptNotionBlockToContentBlock: code", () => {
  it("keeps the language and passes the caption through", () => {
    const block: NotionBlock = {
      id: "code-1",
      type: "code",
      content: { type: "code", text: "const a = 1;", language: "typescript", caption: "sandbox" },
    };

    expect(adaptNotionBlockToContentBlock(block)).toMatchObject({
      type: "code",
      code: "const a = 1;",
      language: "typescript",
      caption: "sandbox",
    });
  });

  it("leaves the caption undefined when Notion sent none", () => {
    const block: NotionBlock = {
      id: "code-2",
      type: "code",
      content: { type: "code", text: "x", language: "javascript" },
    };

    expect(adaptNotionBlockToContentBlock(block).caption).toBeUndefined();
  });
});
