/**
 * Utterances 스크립트를 동적으로 로드하는 함수
 */
export function loadUtterancesScript(
  container: HTMLElement,
  config: {
    repo: string;
    issueTerm: string;
    label: string;
    theme: string;
  }
): void {
  const script = document.createElement("script");
  script.src = "https://utteranc.es/client.js";
  script.setAttribute("repo", config.repo);
  script.setAttribute("issue-term", config.issueTerm);
  script.setAttribute("label", config.label);
  script.setAttribute("theme", config.theme);
  script.setAttribute("crossorigin", "anonymous");
  script.async = true;

  container.appendChild(script);
}

/**
 * Utterances iframe에 테마 변경 메시지를 전송하는 함수
 */
export function updateUtterancesTheme(theme: string): boolean {
  const iframe = document.querySelector<HTMLIFrameElement>(".utterances-frame");

  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ type: "set-theme", theme }, "https://utteranc.es");
    return true;
  }

  return false;
}

/**
 * Utterances iframe이 이미 로드되어 있는지 확인하는 함수
 */
export function isUtterancesLoaded(): boolean {
  return document.querySelector<HTMLIFrameElement>(".utterances-frame") !== null;
}
