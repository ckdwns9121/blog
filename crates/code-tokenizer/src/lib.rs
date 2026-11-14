use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use wasm_bindgen::prelude::*;

const LANGUAGES: &[&str] = &["javascript", "js", "jsx", "typescript", "ts", "tsx"];
const KEYWORDS: &[&str] = &[
    "abstract",
    "as",
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "declare",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "get",
    "if",
    "implements",
    "import",
    "in",
    "infer",
    "instanceof",
    "interface",
    "is",
    "keyof",
    "let",
    "namespace",
    "new",
    "of",
    "private",
    "protected",
    "public",
    "readonly",
    "return",
    "satisfies",
    "set",
    "static",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "type",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
];
const LITERALS: &[&str] = &["true", "false", "null", "undefined", "NaN", "Infinity"];
const BUILTIN_TYPES: &[&str] = &[
    "any", "bigint", "boolean", "never", "number", "object", "string", "symbol", "unknown",
];

// shortcut: TypeScript generics on calls (`useState<T>()`) and decorators stay plain;
// they need a type-aware parser rather than more lexical states.

#[derive(Debug, Serialize, PartialEq)]
struct Token<'a> {
    #[serde(rename = "type")]
    kind: &'static str,
    value: &'a str,
}

/// What the last significant token was. It decides whether `<` starts JSX and `/` starts a regex,
/// because both are only possible where an expression may begin.
#[derive(Clone, Copy, PartialEq)]
enum Prev {
    Start,
    Operand,
    Keyword,
    Punct,
    Dot,
}

fn is_ident_start(c: char) -> bool {
    c == '$'
        || c == '_'
        || c.is_ascii_alphabetic()
        || (('\u{80}'..='\u{FFFF}').contains(&c) && !c.is_whitespace())
}

fn is_ident_char(c: char) -> bool {
    is_ident_start(c) || c.is_ascii_digit()
}

fn is_jsx_name_char(c: char) -> bool {
    is_ident_char(c) || matches!(c, '.' | '-' | ':')
}

/// PascalCase names and single capitals (`T`) are types or components; SCREAMING_CASE stays a value.
fn is_type_name(word: &str) -> bool {
    word.starts_with(|c: char| c.is_ascii_uppercase())
        && (word.len() == 1 || word.bytes().any(|b| b.is_ascii_lowercase()))
}

struct Lexer<'a> {
    src: &'a str,
    pos: usize,
    spans: Vec<(&'static str, usize, usize)>,
    prev: Prev,
    last_word: &'a str,
    /// `<` positions that already failed as JSX. Parsing from a position never depends on outer
    /// state, so retrying is wasted work; nested failures would otherwise double it per level.
    rejected_jsx: BTreeSet<usize>,
    /// Last offset of each `</name`, so checking for a closing tag is a lookup, not a scan.
    last_closing_tag: BTreeMap<&'a str, usize>,
}

impl<'a> Lexer<'a> {
    fn rest(&self) -> &'a str {
        &self.src[self.pos..]
    }

    fn peek(&self) -> Option<char> {
        self.rest().chars().next()
    }

    fn bump(&mut self) {
        if let Some(c) = self.peek() {
            self.pos += c.len_utf8();
        }
    }

    fn bump_while(&mut self, keep: impl Fn(char) -> bool) {
        while self.peek().is_some_and(&keep) {
            self.bump();
        }
    }

    fn emit(&mut self, kind: &'static str, start: usize) {
        if self.pos > start {
            self.spans.push((kind, start, self.pos));
        }
    }

    fn punct(&mut self, len: usize) {
        let start = self.pos;
        self.pos += len;
        self.emit("text", start);
    }

    /// Lexes JavaScript until EOF, or until an unmatched `}` when inside `{…}` / `${…}`.
    fn lex_js(&mut self, in_braces: bool) {
        let mut depth = 0usize;
        while let Some(c) = self.peek() {
            let start = self.pos;
            let rest = self.rest();
            if c.is_whitespace() {
                self.bump_while(char::is_whitespace);
                self.emit("text", start);
                continue;
            }
            if rest.starts_with("//") {
                self.bump_while(|c| c != '\n' && c != '\r');
                self.emit("comment", start);
                continue;
            }
            if rest.starts_with("/*") {
                self.pos += rest.find("*/").map_or(rest.len(), |end| end + 2);
                self.emit("comment", start);
                continue;
            }
            match c {
                '"' | '\'' => {
                    self.quoted(c, true);
                    self.emit("string", start);
                    self.prev = Prev::Operand;
                }
                '`' => {
                    self.template();
                    self.prev = Prev::Operand;
                }
                '0'..='9' => self.number(),
                '.' if rest[1..].starts_with(|c: char| c.is_ascii_digit()) => self.number(),
                '/' if self.prev != Prev::Operand && self.regex() => {
                    self.emit("string", start);
                    self.prev = Prev::Operand;
                }
                '<' if self.prev != Prev::Operand && self.jsx_element() => {
                    self.prev = Prev::Operand
                }
                '{' => {
                    depth += 1;
                    self.punct(1);
                    self.prev = Prev::Punct;
                }
                '}' if depth == 0 && in_braces => return,
                '}' => {
                    depth = depth.saturating_sub(1);
                    self.punct(1);
                    self.prev = Prev::Punct;
                }
                ')' | ']' => {
                    self.punct(1);
                    self.prev = Prev::Operand;
                }
                '.' if !rest.starts_with("...") => {
                    self.punct(1);
                    self.prev = Prev::Dot;
                }
                c if is_ident_start(c) => self.word(),
                _ => {
                    self.bump();
                    self.emit("text", start);
                    self.prev = Prev::Punct;
                }
            }
        }
    }

    fn word(&mut self) {
        let start = self.pos;
        let after_dot = self.prev == Prev::Dot;
        self.bump_while(is_ident_char);
        let word = &self.src[start..self.pos];
        let next = self.rest().trim_start_matches([' ', '\t']).chars().next();
        let kind = if !after_dot && KEYWORDS.contains(&word) {
            "keyword"
        } else if !after_dot && LITERALS.contains(&word) {
            "literal"
        } else if next == Some('(') || (self.prev == Prev::Keyword && self.last_word == "function")
        {
            "function"
        } else if (!after_dot && BUILTIN_TYPES.contains(&word)) || is_type_name(word) {
            "type"
        } else {
            "text"
        };
        self.emit(kind, start);
        self.last_word = word;
        self.prev = if kind == "keyword" && word != "this" && word != "super" {
            Prev::Keyword
        } else {
            Prev::Operand
        };
    }

    fn number(&mut self) {
        let start = self.pos;
        let radix_digit: Option<fn(char) -> bool> = match self.rest().as_bytes() {
            [b'0', b'x' | b'X', ..] => Some(|c| c.is_ascii_hexdigit() || c == '_'),
            [b'0', b'b' | b'B', ..] => Some(|c| matches!(c, '0' | '1' | '_')),
            [b'0', b'o' | b'O', ..] => Some(|c| matches!(c, '0'..='7' | '_')),
            _ => None,
        };
        let decimal = |c: char| c.is_ascii_digit() || c == '_';
        if let Some(digit) = radix_digit {
            self.pos += 2;
            self.bump_while(digit);
        } else {
            self.bump_while(decimal);
            if self.peek() == Some('.') {
                self.bump();
                self.bump_while(decimal);
            }
            let exponent = self.rest().as_bytes();
            if let [b'e' | b'E', rest @ ..] = exponent {
                let sign = usize::from(matches!(rest.first(), Some(b'+' | b'-')));
                if rest.get(sign).is_some_and(u8::is_ascii_digit) {
                    self.pos += 1 + sign;
                    self.bump_while(decimal);
                }
            }
        }
        if self.peek() == Some('n') {
            self.bump();
        }
        self.emit("number", start);
        self.prev = Prev::Operand;
    }

    /// Consumes a quoted string. JS strings end at a line break; JSX attribute strings do not.
    fn quoted(&mut self, quote: char, single_line: bool) {
        self.bump();
        while let Some(c) = self.peek() {
            if single_line && (c == '\n' || c == '\r') {
                return;
            }
            self.bump();
            if c == '\\' {
                self.bump();
            } else if c == quote {
                return;
            }
        }
    }

    fn template(&mut self) {
        let mut start = self.pos;
        self.bump();
        while let Some(c) = self.peek() {
            if c == '\\' {
                self.bump();
                self.bump();
            } else if c == '`' {
                self.bump();
                break;
            } else if self.rest().starts_with("${") {
                self.emit("string", start);
                self.punct(2);
                self.braced_js();
                start = self.pos;
            } else {
                self.bump();
            }
        }
        self.emit("string", start);
    }

    /// Lexes `…}` after an opening brace as its own expression, so the outer context is untouched.
    fn braced_js(&mut self) {
        let outer = self.prev;
        self.prev = Prev::Start;
        self.lex_js(true);
        if self.peek() == Some('}') {
            self.punct(1);
        }
        self.prev = outer;
    }

    fn regex(&mut self) -> bool {
        let start = self.pos;
        self.bump();
        let mut in_class = false;
        while let Some(c) = self.peek() {
            if c == '\n' || c == '\r' {
                break;
            }
            self.bump();
            match c {
                '\\' => self.bump(),
                '[' => in_class = true,
                ']' => in_class = false,
                '/' if !in_class => {
                    self.bump_while(|c| c.is_ascii_alphabetic());
                    return true;
                }
                _ => {}
            }
        }
        self.pos = start;
        false
    }

    fn jsx_space(&mut self) {
        let start = self.pos;
        self.bump_while(char::is_whitespace);
        self.emit("text", start);
    }

    /// Tries to read a JSX element at `<`. On failure nothing is consumed, so `<` stays a comparison
    /// or a TypeScript generic.
    fn jsx_element(&mut self) -> bool {
        if !self.rest()[1..].starts_with(|c: char| c == '>' || is_ident_start(c))
            || self.rejected_jsx.contains(&self.pos)
        {
            return false;
        }
        let (pos, spans) = (self.pos, self.spans.len());
        if self.jsx_element_inner() {
            return true;
        }
        self.pos = pos;
        self.spans.truncate(spans);
        self.rejected_jsx.insert(pos);
        false
    }

    fn jsx_element_inner(&mut self) -> bool {
        self.punct(1);
        let name_start = self.pos;
        self.bump_while(is_jsx_name_char);
        let name = &self.src[name_start..self.pos];
        self.emit("tag", name_start);
        loop {
            self.jsx_space();
            let start = self.pos;
            match self.peek() {
                Some('/') if self.rest().starts_with("/>") => {
                    self.punct(2);
                    return true;
                }
                Some('>') => {
                    self.punct(1);
                    break;
                }
                Some('{') => {
                    self.punct(1);
                    self.braced_js();
                }
                Some(c) if is_ident_start(c) => {
                    self.bump_while(|c| is_ident_char(c) || matches!(c, '-' | ':'));
                    self.emit("attr", start);
                    self.jsx_space();
                    if self.peek() == Some('=') {
                        self.punct(1);
                        self.jsx_space();
                        let value = self.pos;
                        match self.peek() {
                            Some(quote @ ('"' | '\'')) => {
                                self.quoted(quote, false);
                                self.emit("string", value);
                            }
                            Some('{') => {
                                self.punct(1);
                                self.braced_js();
                            }
                            Some('<') if self.jsx_element() => {}
                            _ => return false,
                        }
                    }
                }
                _ => return false,
            }
        }
        // `<T>(value: T) => value` also reaches here; only a later closing tag makes it JSX.
        !self.starts_generic_arrow() && self.has_closing_tag(name) && self.jsx_children()
    }

    /// `(…) =>` or `(…): Return =>` right after `>` is a generic arrow function's signature.
    /// Children such as `(선택)` or `(참고): …` lack the arrow and stay JSX.
    fn starts_generic_arrow(&self) -> bool {
        let rest = self.rest();
        if !rest.starts_with('(') {
            return false;
        }
        let mut depth = 0usize;
        for (at, c) in rest.char_indices() {
            match c {
                '(' => depth += 1,
                ')' => {
                    depth -= 1;
                    if depth == 0 {
                        let after = rest[at + 1..].trim_start();
                        let line = after.split(['\n', '\r']).next().unwrap_or("");
                        return after.starts_with("=>")
                            || (after.starts_with(':') && line.contains("=>"));
                    }
                }
                _ => {}
            }
        }
        false
    }

    fn has_closing_tag(&self, name: &str) -> bool {
        self.last_closing_tag
            .get(name)
            .is_some_and(|&at| at >= self.pos)
    }

    fn jsx_children(&mut self) -> bool {
        loop {
            let start = self.pos;
            match self.peek() {
                // A snippet may stop mid-element; keep what was already recognized.
                None => return true,
                Some('<') if self.rest().starts_with("</") => {
                    self.punct(2);
                    self.jsx_space();
                    let name = self.pos;
                    self.bump_while(is_jsx_name_char);
                    self.emit("tag", name);
                    self.jsx_space();
                    if self.peek() == Some('>') {
                        self.punct(1);
                    }
                    return true;
                }
                Some('<') => {
                    if !self.jsx_element() {
                        self.punct(1);
                    }
                }
                Some('{') => {
                    self.punct(1);
                    self.braced_js();
                }
                Some(_) => {
                    self.bump_while(|c| c != '<' && c != '{');
                    self.emit("text", start);
                }
            }
        }
    }
}

fn tokenize<'a>(code: &'a str, language: &str) -> Vec<Token<'a>> {
    if !LANGUAGES.contains(&language.trim().to_ascii_lowercase().as_str()) {
        return vec![Token {
            kind: "text",
            value: code,
        }];
    }
    let mut lexer = Lexer {
        src: code,
        pos: 0,
        spans: Vec::new(),
        prev: Prev::Start,
        last_word: "",
        rejected_jsx: BTreeSet::new(),
        last_closing_tag: code
            .match_indices("</")
            .map(|(at, _)| {
                let name = &code[at + 2..];
                let end = name
                    .find(|c: char| !is_jsx_name_char(c))
                    .unwrap_or(name.len());
                (&name[..end], at)
            })
            .collect(),
    };
    lexer.lex_js(false);
    let mut tokens: Vec<Token<'a>> = Vec::new();
    let mut spans = lexer.spans.into_iter().peekable();
    while let Some((kind, start, mut end)) = spans.next() {
        while let Some(&(_, _, next_end)) =
            spans.peek().filter(|span| span.0 == kind && span.1 == end)
        {
            end = next_end;
            spans.next();
        }
        tokens.push(Token {
            kind,
            value: &code[start..end],
        });
    }
    tokens
}

#[wasm_bindgen(js_name = tokenizeCode)]
pub fn tokenize_code(code: &str, language: &str) -> String {
    serde_json::to_string(&tokenize(code, language)).expect("tokens contain only strings")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn of_kind<'a>(tokens: &[Token<'a>], kind: &str) -> Vec<&'a str> {
        tokens
            .iter()
            .filter(|t| t.kind == kind)
            .map(|t| t.value)
            .collect()
    }

    #[test]
    fn preserves_unicode_whitespace_and_incomplete_code() {
        for code in [
            "",
            "\tconst 안녕 = '😀';\r\n",
            "/* unfinished\nconst value",
            "'unfinished",
            "`multiline\nconst value",
            "`a ${b",
            "<Tab value=",
            "<div>{open && <span>",
            "x = /[/]",
            "a < b && c > d",
        ] {
            let tokens = tokenize(code, " TypeScript ");
            assert_eq!(
                tokens.iter().map(|token| token.value).collect::<String>(),
                code
            );
        }
    }

    #[test]
    fn strings_and_comments_take_precedence() {
        let code = r#""const \" // false" /* let 12 */ `return ${true}` // const 42
const answer = 42;"#;
        let tokens = tokenize(code, "js");
        assert_eq!(of_kind(&tokens, "keyword"), ["const"]);
        assert_eq!(of_kind(&tokens, "number"), ["42"]);
    }

    #[test]
    fn recognizes_numbers_and_keeps_identifiers_intact() {
        let tokens = tokenize(
            "constant const한글 $return returnValue 0xff 0b10 0o77 1_000 .5 1e-3 12n",
            "ts",
        );
        assert!(tokens.iter().all(|token| token.kind != "keyword"));
        assert_eq!(
            of_kind(&tokens, "number"),
            ["0xff", "0b10", "0o77", "1_000", ".5", "1e-3", "12n"]
        );
    }

    #[test]
    fn colors_jsx_tags_attributes_and_embedded_expressions() {
        let code = r#"// 컴파운드
<Tab value={tab} onChange={(next) => setTab(next)}>
  <Tab.List aria-label="메뉴">
    <Tab.Trigger value="home">if you return</Tab.Trigger>
  </Tab.List>
  {open && <Badge count={3} />}
</Tab>"#;
        for language in ["typescript", "tsx", "jsx"] {
            let tokens = tokenize(code, language);
            assert_eq!(
                of_kind(&tokens, "tag"),
                [
                    "Tab",
                    "Tab.List",
                    "Tab.Trigger",
                    "Tab.Trigger",
                    "Tab.List",
                    "Badge",
                    "Tab"
                ]
            );
            assert_eq!(
                of_kind(&tokens, "attr"),
                ["value", "onChange", "aria-label", "value", "count"]
            );
            assert_eq!(of_kind(&tokens, "string"), [r#""메뉴""#, r#""home""#]);
            assert_eq!(of_kind(&tokens, "function"), ["setTab"]);
            assert_eq!(of_kind(&tokens, "number"), ["3"]);
            // Text between tags is prose, not code.
            assert!(of_kind(&tokens, "keyword").is_empty());
        }
    }

    #[test]
    fn keeps_comparisons_and_generics_out_of_jsx() {
        let tokens = tokenize(
            "if (a <b) {}\nconst id = <T,>(value: T) => value;\nconst box: Array<string> = [];\nfunction pick<K extends keyof T>(key: K) {}",
            "ts",
        );
        assert!(of_kind(&tokens, "tag").is_empty());
        assert!(of_kind(&tokens, "attr").is_empty());
        assert_eq!(of_kind(&tokens, "function"), ["pick"]);
        assert_eq!(
            of_kind(&tokens, "type"),
            ["T", "T", "Array", "string", "K", "T", "K"]
        );
    }

    #[test]
    fn generic_arrows_stay_code_even_with_a_matching_closing_tag_elsewhere() {
        for code in [
            "const id = <T>(x: T) => x; const closing = \"</T>\";",
            "const id = <T>(x: T): T => x; const closing = \"</T>\";",
        ] {
            let tokens = tokenize(code, "ts");
            assert!(of_kind(&tokens, "tag").is_empty(), "{code}");
            assert_eq!(of_kind(&tokens, "keyword"), ["const", "const"]);
        }
        let tokens = tokenize("<>\n<p>(선택)</p>\n<p>(참고): 내용</p>\n</>", "tsx");
        assert_eq!(of_kind(&tokens, "tag"), ["p", "p", "p", "p"]);
    }

    #[test]
    fn nested_failing_jsx_candidates_are_tried_once() {
        let depth = 300;
        let code = format!("{}0{}", "<A p={".repeat(depth), "}>".repeat(depth));
        let tokens = tokenize(&code, "ts");
        assert_eq!(tokens.iter().map(|t| t.value).collect::<String>(), code);
        assert!(of_kind(&tokens, "tag").is_empty());
    }

    #[test]
    fn colors_calls_types_templates_and_regexes() {
        let tokens = tokenize(
            "const total: number = items.reduce((sum, item) => sum + item.price, 0);\nconst label = `${format(total)}원`;\nconst digits = /\\d+/g.test(label) ? total / 2 : 0;\nthis.default = Props;",
            "ts",
        );
        assert_eq!(of_kind(&tokens, "function"), ["reduce", "format", "test"]);
        assert_eq!(of_kind(&tokens, "type"), ["number", "Props"]);
        assert_eq!(of_kind(&tokens, "string"), ["`", "원`", "/\\d+/g"]);
        assert_eq!(of_kind(&tokens, "number"), ["0", "2", "0"]);
        assert_eq!(
            of_kind(&tokens, "keyword"),
            ["const", "const", "const", "this"]
        );
    }

    #[test]
    fn unsupported_languages_stay_plain() {
        for language in ["", "text", "python", "html"] {
            assert_eq!(
                tokenize("const value = 42;\n", language),
                [Token {
                    kind: "text",
                    value: "const value = 42;\n"
                }]
            );
        }
    }
}
