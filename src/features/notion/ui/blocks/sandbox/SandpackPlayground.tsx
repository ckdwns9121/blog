"use client";

import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import type { SandboxSpec } from "./sandboxSpec";
import { darkSandpackTheme, lightSandpackTheme } from "./sandpackTheme";

interface SandpackPlaygroundProps {
  spec: SandboxSpec;
  isDark: boolean;
}

/**
 * Sandpack 본체. 번들러는 CodeSandbox 가 호스팅하는 iframe 에서 돌고, 결과도 iframe 으로
 * 보인다. 그래서 독자가 코드를 망가뜨려도 블로그 페이지는 멈추지 않는다.
 *
 * 이 파일은 무겁기 때문에 SandpackBlock 이 화면에 보일 때만 동적으로 불러온다.
 */
export default function SandpackPlayground({ spec, isDark }: SandpackPlaygroundProps) {
  const fileCount = Object.keys(spec.files).length;

  return (
    <SandpackProvider
      template={spec.template}
      files={spec.files}
      theme={isDark ? darkSandpackTheme : lightSandpackTheme}
      options={{ activeFile: spec.activeFile }}
    >
      <SandpackLayout className="!rounded-lg">
        <SandpackCodeEditor
          showLineNumbers
          showInlineErrors
          wrapContent
          showTabs={fileCount > 1}
          style={{ height: 360 }}
        />
        <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton style={{ height: 360 }} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
