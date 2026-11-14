export type CodeToken = {
  type: "text" | "comment" | "string" | "keyword" | "number" | "literal" | "function" | "type" | "tag" | "attr";
  value: string;
};

let tokenizer: Promise<typeof import("./generated/code_tokenizer")> | undefined;

export function supportsHighlighting(language: string): boolean {
  return /^(javascript|js|jsx|typescript|ts|tsx)$/i.test(language.trim());
}

export async function tokenizeCode(code: string, language: string): Promise<CodeToken[]> {
  if (!supportsHighlighting(language)) return [{ type: "text", value: code }];
  tokenizer ??= import("./generated/code_tokenizer").then(async (bindings) => {
    await bindings.default();
    return bindings;
  });
  const bindings = await tokenizer;
  const tokens = JSON.parse(bindings.tokenizeCode(code, language.trim().toLowerCase())) as CodeToken[];
  // Rust strings cannot represent lone UTF-16 surrogates; always preserve the displayed source.
  return tokens.map(({ value }) => value).join("") === code ? tokens : [{ type: "text", value: code }];
}
