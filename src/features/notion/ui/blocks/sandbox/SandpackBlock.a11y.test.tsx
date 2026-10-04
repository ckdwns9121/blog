import { act, render, screen } from "@testing-library/react";
import { SandpackBlock } from "./SandpackBlock";
import { expectNoA11yViolations } from "@/test/a11y";

// react-syntax-highlighter 의 ESM 번들은 jest 가 변환하지 못한다. 정적 표시만 흉내 낸다.
jest.mock("../CodeBlock", () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    <pre data-testid="static-code" data-language={language}>
      <code>{code}</code>
    </pre>
  ),
}));

// Sandpack 본체는 CodeSandbox 번들러 iframe 이 필요하므로 자리만 표시한다.
jest.mock("./SandpackPlayground", () => ({
  __esModule: true,
  default: ({ spec }: { spec: { template: string; files: Record<string, string> } }) => (
    <div data-testid="playground" data-template={spec.template} data-files={Object.keys(spec.files).join(",")} />
  ),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  // 동적 import 를 동기 모듈로 바꿔 테스트에서 바로 그려지게 한다.
  default: (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    let Loaded: React.ComponentType<unknown> | null = null;
    void loader().then((mod) => {
      Loaded = mod.default;
    });
    return function Dynamic(props: Record<string, unknown>) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("./SandpackPlayground") as { default: React.ComponentType<Record<string, unknown>> };
      const Component = Loaded ?? mod.default;
      return <Component {...props} />;
    };
  },
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

let intersect: (() => void) | undefined;

beforeAll(() => {
  class FakeIntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {
      intersect = () =>
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "IntersectionObserver", { writable: true, value: FakeIntersectionObserver });
});

describe("SandpackBlock", () => {
  it("renders a plain code block when the caption is not a sandbox directive", async () => {
    const { container } = render(<SandpackBlock code="const a = 1;" language="typescript" caption="예제" />);

    expect(screen.getByTestId("static-code")).toBeInTheDocument();
    expect(screen.queryByRole("region")).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("shows the static code until the block scrolls near, then mounts the playground", async () => {
    const { container } = render(
      <SandpackBlock code={"export default () => <p>hi</p>;\n// @file /Button.tsx\nexport const B = 1;"} language="tsx" caption="sandbox" />,
    );

    expect(screen.getByRole("region", { name: "편집하고 실행해 볼 수 있는 코드 예제" })).toBeInTheDocument();
    expect(screen.getByTestId("static-code")).toBeInTheDocument();
    await expectNoA11yViolations(container);

    act(() => intersect?.());

    const playground = await screen.findByTestId("playground");
    expect(playground).toHaveAttribute("data-template", "react-ts");
    expect(playground).toHaveAttribute("data-files", "/App.tsx,/Button.tsx");
    expect(screen.queryByTestId("static-code")).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("explains an unknown template and still shows the code", async () => {
    const { container } = render(<SandpackBlock code="x" language="typescript" caption="sandbox:angular" />);

    expect(screen.getByRole("alert")).toHaveTextContent("angular");
    expect(screen.getByTestId("static-code")).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
