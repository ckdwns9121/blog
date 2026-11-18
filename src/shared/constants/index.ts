const POSTS_PER_PAGE = 20 as const;

/**
 * 사이트의 대표 주소.
 *
 * 프로덕션은 apex(`changjun.dev`)를 `www.changjun.dev`로 308 리다이렉트한다.
 * canonical·사이트맵·피드가 apex를 가리키면 검색엔진이 같은 문서를 두 주소로
 * 보게 되므로, 코드가 만드는 이 사이트의 모든 절대 URL은 이 값(www) 하나에서 나온다.
 * (Utterances의 `utteranc.es`처럼 바깥 서비스를 가리키는 URL은 여기서 만들지 않는다.)
 */
const SITE_URL = "https://www.changjun.dev";

/** apex 호스트. 308 리다이렉트 대상이므로 절대 URL에 남기지 않는다. */
const APEX_HOST = "changjun.dev";

const WWW_HOST = "www.changjun.dev";

/** 운영 도메인인지 (apex/www 둘 다). 운영은 항상 https다. */
function isProductionHost(hostname: string): boolean {
  return hostname === APEX_HOST || hostname === WWW_HOST;
}

/**
 * 환경변수나 문자열로 받은 주소를 절대 URL 한 형태로 정리한다.
 *
 * - 빈 값이면 SITE_URL
 * - 스킴이 없으면 https를 붙인다 (`changjun.dev` → `https://changjun.dev`)
 * - http/https가 아닌 스킴은 SITE_URL로 되돌린다 (`file:` 같은 값이 robots.txt로 나가지 않게)
 * - apex 호스트는 www로 바꾸고, 운영 도메인은 https로 고정한다
 * - 끝의 `/`는 떼어낸다. 호출부가 `${BASE_URL}/posts/...`로 이어 붙이기 때문이다
 * - 해석할 수 없는 값이면 SITE_URL
 */
function normalizeSiteUrl(rawUrl?: string | null): string {
  const trimmed = rawUrl?.trim();

  if (!trimmed) return SITE_URL;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);

    if (url.protocol !== "https:" && url.protocol !== "http:") return SITE_URL;

    if (isProductionHost(url.hostname)) {
      url.protocol = "https:";
      url.hostname = WWW_HOST;
    }

    const path = url.pathname.replace(/\/+$/, "");

    return `${url.protocol}//${url.host}${path}`;
  } catch {
    return SITE_URL;
  }
}

const BASE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export { BASE_URL, POSTS_PER_PAGE, SITE_URL, normalizeSiteUrl };
