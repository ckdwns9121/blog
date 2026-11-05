use regex::Regex;
use serde::Serialize;
use std::sync::LazyLock;
use wasm_bindgen::prelude::*;

const KEYWORDS: &str = "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface is keyof let namespace new of private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield";
const LITERALS: &[&str] = &["true", "false", "null", "undefined", "NaN", "Infinity"];

// shortcut: JSX, regex literals and template interpolation are not parsed; add lexical states when those need distinct colors.
static PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(//[^\r\n]*|/\*(?s:.)*?(?:\*/|$))|("(?:\\(?s:.)|[^"\\])*(?:"|$)|'(?:\\(?s:.)|[^'\\])*(?:'|$)|`(?:\\(?s:.)|[^`\\])*(?:`|$))|((?-u:\b)(?:0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|[0-9][0-9_]*(?:\.[0-9_]*)?(?:[eE][+-]?[0-9_]+)?n?)|\.[0-9][0-9_]*(?:[eE][+-]?[0-9_]+)?)|([$A-Z_a-z\x{0080}-\x{FFFF}][$A-Z_a-z0-9\x{0080}-\x{FFFF}]*)"#).expect("token pattern must compile")
});

#[derive(Debug, Serialize, PartialEq)]
struct Token<'a> {
    #[serde(rename = "type")]
    kind: &'static str,
    value: &'a str,
}

fn tokenize<'a>(code: &'a str, language: &str) -> Vec<Token<'a>> {
    if !["javascript", "js", "typescript", "ts"]
        .contains(&language.trim().to_ascii_lowercase().as_str())
    {
        return vec![Token {
            kind: "text",
            value: code,
        }];
    }
    let mut tokens = Vec::new();
    let mut offset = 0;
    for captures in PATTERN.captures_iter(code) {
        let matched = captures.get(0).unwrap();
        if matched.start() > offset {
            tokens.push(Token {
                kind: "text",
                value: &code[offset..matched.start()],
            });
        }
        let value = matched.as_str();
        let kind = if captures.get(1).is_some() {
            "comment"
        } else if captures.get(2).is_some() {
            "string"
        } else if captures.get(3).is_some() {
            "number"
        } else if KEYWORDS
            .split_ascii_whitespace()
            .any(|keyword| keyword == value)
        {
            "keyword"
        } else if LITERALS.contains(&value) {
            "literal"
        } else {
            "text"
        };
        tokens.push(Token { kind, value });
        offset = matched.end();
    }
    if offset < code.len() {
        tokens.push(Token {
            kind: "text",
            value: &code[offset..],
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

    #[test]
    fn preserves_unicode_whitespace_and_incomplete_code() {
        for code in [
            "",
            "\tconst 안녕 = '😀';\r\n",
            "/* unfinished\nconst value",
            "'unfinished",
            "`multiline\nconst value",
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
        assert_eq!(
            tokens
                .iter()
                .filter(|t| t.kind == "keyword")
                .map(|t| t.value)
                .collect::<Vec<_>>(),
            ["const"]
        );
        assert_eq!(
            tokens
                .iter()
                .filter(|t| t.kind == "number")
                .map(|t| t.value)
                .collect::<Vec<_>>(),
            ["42"]
        );
    }

    #[test]
    fn recognizes_numbers_and_keeps_identifiers_intact() {
        let tokens = tokenize(
            "constant const한글 $return returnValue 0xff 0b10 0o77 1_000 .5 1e-3 12n",
            "ts",
        );
        assert!(tokens.iter().all(|token| token.kind != "keyword"));
        assert_eq!(
            tokens
                .iter()
                .filter(|t| t.kind == "number")
                .map(|t| t.value)
                .collect::<Vec<_>>(),
            ["0xff", "0b10", "0o77", "1_000", ".5", "1e-3", "12n"]
        );
    }

    #[test]
    fn unsupported_languages_stay_plain() {
        for language in ["", "text", "python", "html", "tsx"] {
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
