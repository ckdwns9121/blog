import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";

const root = process.cwd();
if (execFileSync("wasm-pack", ["--version"], { encoding: "utf8" }).trim() !== "wasm-pack 0.15.0") {
  throw new Error("Install wasm-pack 0.15.0 to rebuild the checked-in tokenizer.");
}
const output = mkdtempSync(join(tmpdir(), "code-tokenizer-"));
try {
  execFileSync("wasm-pack", ["build", "crates/code-tokenizer", "--target", "web", "--release", "--out-name", "code_tokenizer", "--out-dir", output, "--locked"], {
    stdio: "inherit",
    env: {
      ...process.env,
      RUSTFLAGS: `--remap-path-prefix=${root}=/workspace --remap-path-prefix=${process.env.CARGO_HOME || join(homedir(), ".cargo")}=/cargo`,
    },
  });
  const bindings = resolve("src/features/notion/wasm/generated");
  const assets = resolve("public/wasm");
  mkdirSync(bindings, { recursive: true });
  mkdirSync(assets, { recursive: true });
  let glue = readFileSync(join(output, "code_tokenizer.js"), "utf8");
  const defaultUrl = "new URL('code_tokenizer_bg.wasm', import.meta.url)";
  if (glue.split(defaultUrl).length !== 2) throw new Error("Generated Wasm URL changed; review the build adapter.");
  // Next serves the binary as a public asset; wasm-bindgen still owns initialization and its ABI.
  glue = glue.replace(defaultUrl, "'/wasm/code_tokenizer_bg.wasm'");
  writeFileSync(join(bindings, "code_tokenizer.js"), glue);
  copyFileSync(join(output, "code_tokenizer.d.ts"), join(bindings, "code_tokenizer.d.ts"));
  copyFileSync(join(output, "code_tokenizer_bg.wasm"), join(assets, "code_tokenizer_bg.wasm"));
} finally {
  rmSync(output, { recursive: true, force: true });
}
