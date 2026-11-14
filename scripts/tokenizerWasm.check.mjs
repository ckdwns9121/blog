import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import init, { tokenizeCode } from "../src/features/notion/wasm/generated/code_tokenizer.js";

await init({ module_or_path: await readFile(new URL("../public/wasm/code_tokenizer_bg.wasm", import.meta.url)) });
const tokenize = (code, language) => JSON.parse(tokenizeCode(code, language));

test("compiled Wasm preserves Unicode, CRLF, whitespace, incomplete strings and empty input", () => {
  for (const code of ["", "\tconst 안녕 = '😀';\r\n", "/* unfinished\nconst value", "'unfinished", "`multiline\nconst value", '<script>alert("x")</script>']) {
    for (const language of ["js", "javascript", "jsx", "ts", "typescript", "tsx", " TypeScript "]) {
      assert.equal(tokenize(code, language).map(({ value }) => value).join(""), code);
    }
  }
});

test("compiled Wasm classifies keywords, numeric forms and literals without matching inside identifiers", () => {
  const tokens = tokenize("const constant const한글 $return returnValue 0xff 0b10 0o77 1_000 .5 1e-3 12n true", "ts");
  assert.deepEqual(tokens.filter(({ type }) => type === "keyword"), [{ type: "keyword", value: "const" }]);
  assert.deepEqual(tokens.filter(({ type }) => type === "number").map(({ value }) => value), ["0xff", "0b10", "0o77", "1_000", ".5", "1e-3", "12n"]);
  assert.deepEqual(tokens.filter(({ type }) => type === "literal"), [{ type: "literal", value: "true" }]);
});

test("compiled Wasm keeps strings, escaped quotes, templates and comments ahead of keywords", () => {
  const code = '"const \\" // false" /* let 12 */ `return ${true}` // const 42\nconst answer = 42;';
  const tokens = tokenize(code, "js");
  assert.equal(tokens.map(({ value }) => value).join(""), code);
  assert.deepEqual(tokens.filter(({ type }) => type === "keyword"), [{ type: "keyword", value: "const" }]);
  assert.deepEqual(tokens.filter(({ type }) => type === "number"), [{ type: "number", value: "42" }]);
});

test("compiled Wasm colors JSX tags, attributes and calls while leaving child text as prose", () => {
  const code = '// 탭\n<Tab value={tab} onChange={(next) => setTab(next)}>\n  <Tab.Trigger value="home">if you return</Tab.Trigger>\n</Tab>';
  for (const language of ["typescript", "tsx"]) {
    const tokens = tokenize(code, language);
    const values = (type) => tokens.filter((token) => token.type === type).map(({ value }) => value);
    assert.equal(tokens.map(({ value }) => value).join(""), code);
    assert.deepEqual(values("tag"), ["Tab", "Tab.Trigger", "Tab.Trigger", "Tab"]);
    assert.deepEqual(values("attr"), ["value", "onChange", "value"]);
    assert.deepEqual(values("function"), ["setTab"]);
    assert.deepEqual(values("keyword"), []);
  }
});

test("compiled Wasm keeps comparisons and TypeScript generics out of JSX", () => {
  const tokens = tokenize("if (a <b) {}\nconst id = <T,>(value: T) => value;\nconst box: Array<string> = [];", "ts");
  assert.deepEqual(tokens.filter(({ type }) => type === "tag"), []);
  assert.deepEqual(tokens.filter(({ type }) => type === "type").map(({ value }) => value), ["T", "T", "Array", "string"]);
});

test("compiled Wasm leaves unsupported languages plain", () => {
  for (const language of ["", "text", "python", "html"]) {
    assert.deepEqual(tokenize("const value = 42;\n", language), [{ type: "text", value: "const value = 42;\n" }]);
  }
});
