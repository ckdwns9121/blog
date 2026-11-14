jest.mock("./generated/code_tokenizer", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  tokenizeCode: jest.fn((code: string) => JSON.stringify([{ type: "text", value: code }])),
}));

beforeEach(() => { jest.resetModules(); });

it("shares one initialization across simultaneous code blocks", async () => {
  const bindings = await import("./generated/code_tokenizer");
  const { tokenizeCode } = await import("./tokenizeCode");
  await Promise.all([tokenizeCode("first", "js"), tokenizeCode("second", "ts")]);
  expect(bindings.default).toHaveBeenCalledTimes(1);
  expect(bindings.tokenizeCode).toHaveBeenCalledTimes(2);
});

it("does not initialize Wasm for unsupported languages", async () => {
  const bindings = await import("./generated/code_tokenizer");
  const { tokenizeCode } = await import("./tokenizeCode");
  expect(await tokenizeCode("print(42)", "python")).toEqual([{ type: "text", value: "print(42)" }]);
  expect(bindings.default).not.toHaveBeenCalled();
});

it("shares a rejected initialization without repeated fetches", async () => {
  const bindings = await import("./generated/code_tokenizer");
  jest.mocked(bindings.default).mockRejectedValue(new Error("Wasm unavailable"));
  const { tokenizeCode } = await import("./tokenizeCode");
  await expect(tokenizeCode("first", "js")).rejects.toThrow("Wasm unavailable");
  await expect(tokenizeCode("second", "ts")).rejects.toThrow("Wasm unavailable");
  expect(bindings.default).toHaveBeenCalledTimes(1);
});

it("preserves source when UTF-16 cannot round-trip through Rust", async () => {
  const bindings = await import("./generated/code_tokenizer");
  jest.mocked(bindings.tokenizeCode).mockReturnValue('[{"type":"text","value":"�"}]');
  const { tokenizeCode } = await import("./tokenizeCode");
  expect(await tokenizeCode("\ud800", "js")).toEqual([{ type: "text", value: "\ud800" }]);
});

it("highlights JSX and TSX alongside plain JavaScript and TypeScript", async () => {
  const { supportsHighlighting } = await import("./tokenizeCode");
  for (const language of ["js", "JavaScript", "jsx", "ts", "typescript", " TSX "]) expect(supportsHighlighting(language)).toBe(true);
  for (const language of ["python", "html", "text", ""]) expect(supportsHighlighting(language)).toBe(false);
});
