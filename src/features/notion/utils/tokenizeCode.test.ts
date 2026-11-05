import { tokenizeCode } from "./tokenizeCode";

describe("tokenizeCode", () => {
  it.each(["javascript", "js", "typescript", "ts", " TypeScript "])("highlights %s without changing source", (language) => {
    const code = '\tconst 안녕: string = "hello";\r\n// comment\nreturn true;\n';
    const tokens = tokenizeCode(code, language);

    expect(tokens.map(({ value }) => value).join("")).toBe(code);
    expect(tokens).toContainEqual({ type: "keyword", value: "const" });
    expect(tokens).toContainEqual({ type: "literal", value: "true" });
  });

  it("keeps keywords inside escaped strings, templates and comments unhighlighted", () => {
    const code = '"const \\" // false" /* let 12 */ `return ${true}` // const 42\nconst answer = 42;';
    const tokens = tokenizeCode(code, "js");

    expect(tokens.filter(({ type }) => type === "keyword")).toEqual([{ type: "keyword", value: "const" }]);
    expect(tokens.filter(({ type }) => type === "number")).toEqual([{ type: "number", value: "42" }]);
    expect(tokens.map(({ value }) => value).join("")).toBe(code);
  });

  it("keeps identifiers containing keywords intact and recognizes numeric literals", () => {
    const tokens = tokenizeCode("constant const한글 $return returnValue 0xff 0b10 0o77 1_000 .5 1e-3 12n", "ts");

    expect(tokens.filter(({ type }) => type === "keyword")).toEqual([]);
    expect(tokens.filter(({ type }) => type === "number").map(({ value }) => value))
      .toEqual(["0xff", "0b10", "0o77", "1_000", ".5", "1e-3", "12n"]);
  });

  it.each(["", "text", "python", "html"])("leaves unsupported language %s untouched", (language) => {
    expect(tokenizeCode("const value = '<script>';\n", language)).toEqual([
      { type: "text", value: "const value = '<script>';\n" },
    ]);
  });

  it.each(["", "/* unfinished\nconst value", "'unfinished", "`multiline\nconst value", "const 값 = '한글';\n"])("preserves empty and incomplete input %j", (code) => {
    expect(tokenizeCode(code, "js").map(({ value }) => value).join("")).toBe(code);
  });
});
