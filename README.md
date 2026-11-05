# Changjun.blog - 개발 기술 블로그

Next.js 15와 Notion API를 활용한 **SSG(Static Site Generation)** 기반 개발 블로그입니다.

## Rust/Wasm code highlighting

JavaScript/TypeScript highlighting runs in a Rust tokenizer compiled with wasm-bindgen.
The server and first client render show the original code; supported blocks share one
lazy Wasm initialization. A failed download leaves code readable and copyable. Other
languages remain plain text. JSX, regex literals and template interpolation are not
fully parsed. This is an implementation experiment; no speedup is claimed.

The checked-in bindings under `src/features/notion/wasm/generated/` and binary under
`public/wasm/` let normal Next/Vercel builds run without Rust. To change the tokenizer:

```sh
rustup show # installs the pinned toolchain and wasm32 target from rust-toolchain.toml
cargo install wasm-pack --version 0.15.0 --locked
pnpm build:wasm
pnpm test:wasm
```

Commit the Rust source, Cargo.lock and rebuilt bindings/binary together. The build
script redirects wasm-bindgen's default binary URL to `/wasm/code_tokenizer_bg.wasm`
so Next's bundler handles only JavaScript. CI rebuilds and checks artifact freshness.
