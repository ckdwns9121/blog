export type CodeToken = {
  type: "text" | "comment" | "string" | "keyword" | "number" | "literal";
  value: string;
};

const KEYWORDS = new Set(
  "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface is keyof let namespace new of private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield".split(" "),
);
const LITERALS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);

export function tokenizeCode(code: string, language: string): CodeToken[] {
  if (!/^(javascript|js|typescript|ts)$/i.test(language.trim())) {
    return [{ type: "text", value: code }];
  }

  // shortcut: JSX, regex literals and template interpolation are not parsed; add lexical states when those need distinct colors.
  const pattern = /(\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)|`(?:\\[\s\S]|[^`\\])*(?:`|$))|(\b(?:0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?n?)|\.\d[\d_]*(?:[eE][+-]?[\d_]+)?)|([$A-Z_a-z\u0080-\uFFFF][$\w\u0080-\uFFFF]*)/g;
  const tokens: CodeToken[] = [];
  let offset = 0;

  for (const match of code.matchAll(pattern)) {
    const index = match.index;
    if (index > offset) tokens.push({ type: "text", value: code.slice(offset, index) });
    const value = match[0];
    const type = match[1]
      ? "comment"
      : match[2]
        ? "string"
        : match[3]
          ? "number"
          : KEYWORDS.has(value)
            ? "keyword"
            : LITERALS.has(value)
              ? "literal"
              : "text";
    tokens.push({ type, value });
    offset = index + value.length;
  }

  if (offset < code.length) tokens.push({ type: "text", value: code.slice(offset) });
  return tokens;
}
