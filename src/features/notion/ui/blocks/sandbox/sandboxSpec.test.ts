import { buildSandboxSpec, inferTemplate, parseSandboxCaption, splitFiles } from "./sandboxSpec";

describe("parseSandboxCaption", () => {
  it("ignores captions that are not a sandbox directive", () => {
    expect(parseSandboxCaption(undefined)).toBeNull();
    expect(parseSandboxCaption("")).toBeNull();
    expect(parseSandboxCaption("예제 코드")).toBeNull();
    expect(parseSandboxCaption("sandboxes")).toBeNull();
  });

  it("accepts the bare directive and a template suffix, case-insensitively", () => {
    expect(parseSandboxCaption("sandbox")).toEqual({});
    expect(parseSandboxCaption("  Sandbox ")).toEqual({});
    expect(parseSandboxCaption("sandbox:react")).toEqual({ template: "react" });
    expect(parseSandboxCaption("SANDBOX:Vanilla-TS")).toEqual({ template: "vanilla-ts" });
  });

  it("reports an unknown template instead of guessing", () => {
    const result = parseSandboxCaption("sandbox:angular");
    expect(result).toMatchObject({ error: expect.stringContaining("angular") });
  });
});

describe("inferTemplate", () => {
  it("maps Notion languages to Sandpack templates", () => {
    expect(inferTemplate("typescript")).toBe("react-ts");
    expect(inferTemplate("tsx")).toBe("react-ts");
    expect(inferTemplate("javascript")).toBe("react");
    expect(inferTemplate("JSX")).toBe("react");
    expect(inferTemplate("html")).toBe("static");
    expect(inferTemplate("plain text")).toBe("react-ts");
  });
});

describe("splitFiles", () => {
  it("keeps a single block as the entry file", () => {
    expect(splitFiles("export default () => <p>hi</p>;", "/App.tsx")).toEqual({
      "/App.tsx": "export default () => <p>hi</p>;\n",
    });
  });

  it("splits on @file markers in any comment style and normalizes paths", () => {
    const code = [
      "import { Button } from './Button';",
      "export default () => <Button />;",
      "// @file Button.tsx",
      "export const Button = () => <button>눌러 보세요</button>;",
      "/* @file /styles.css */",
      "button { color: red; }",
      "<!-- @file public/index.html -->",
      "<div id=\"root\"></div>",
    ].join("\n");

    expect(splitFiles(code, "/App.tsx")).toEqual({
      "/App.tsx": "import { Button } from './Button';\nexport default () => <Button />;\n",
      "/Button.tsx": "export const Button = () => <button>눌러 보세요</button>;\n",
      "/styles.css": "button { color: red; }\n",
      "/public/index.html": "<div id=\"root\"></div>\n",
    });
  });

  it("drops empty extra files but keeps an empty entry file", () => {
    expect(splitFiles("// @file /a.ts\n\n", "/App.tsx")).toEqual({ "/App.tsx": "" });
  });
});

describe("buildSandboxSpec", () => {
  it("returns null for ordinary code blocks", () => {
    expect(buildSandboxSpec(undefined, "typescript", "const a = 1;")).toBeNull();
  });

  it("infers the template from the language and uses its entry file", () => {
    expect(buildSandboxSpec("sandbox", "html", "<h1>안녕</h1>")).toEqual({
      template: "static",
      files: { "/index.html": "<h1>안녕</h1>\n" },
      activeFile: "/index.html",
    });
  });

  it("honours an explicit template over the language", () => {
    const spec = buildSandboxSpec("sandbox:react", "typescript", "export default () => null;");
    expect(spec).toMatchObject({ template: "react", activeFile: "/App.js" });
  });

  it("passes through template errors", () => {
    expect(buildSandboxSpec("sandbox:nope", "typescript", "")).toMatchObject({ error: expect.any(String) });
  });
});
