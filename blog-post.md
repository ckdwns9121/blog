# 블로그를 만들게 된 배경

예전부터 개인 기술 블로그를 하나 만들어야겠다고 생각했는데 계속 계속 미뤘다. 회사 일이나 다른 업무를 하다 보면서 점점 우선순위가 뒤로 밀려났고 그러다 자연스럽게 까먹게 되었다랄까..

예전부터 개인 기술 블로그하나 갖고싶다는 생각을 하고 있었다. 하지만 회사 일, 사이드 프로젝트, 이것저것 하다 보니 자연스레 잊고 지냈다. ~~(게을러서 그럼)~~

나는 최근까지 **velog**를 사용했었다. 내가 velog를 사용한 이유는 국내에서 유일한 개발자용 블로그였고, 글도 마크다운으로 쉽게 작성할 수 있었다는 장점이 있었다.

하지만 요즘은 벨로그는 예전 같지 않은것 같다. 초반엔 글의 질도 좋고 커뮤니티도 활발했는데 지금은 스팸성 글이나 광고가 많아지고 잘 정리된 기술 포스트를 찾기가 어려웠다.

티스토리로 옮길까도 고민했었지만 커스터마이징 과정이 번거로웠고, 디자인을 내 입맛에 맞추는 게 생각보다 귀찮았다. 이참에 **직접 만들어보는 게 낫겠다**는 생각이 들었다.!!

![image.png](attachment:a4d0993d-6b36-4390-b6b0-5b20b1467d31:image.png)

마침 찬규와 의찬이가 "**각자 기술 블로그를 만들어보기**"라는 스터디를 열어보자고 했고 좋은 기회라고 생각해서 이번에 확실히 끝내보기로 했다.

"어떻게 만들면 좋을까?"를 꽤 고민했는데, 항해플러스 9주차 과제에서 **바닐라 JS와 React로 SSR과 SSG를 직접 구현한 과제를 토대로** 그 과정을 조금 더 발전시켜 내 블로그를 완전히 직접 만들어보면 어떨까 하는 생각이 들었다. 과제를 복습할 수 있으면서, 기술적으로도 더 깊게 탐구해볼 수 있는 기회가 될 것 같았다.

하지만 스터디의 취지가 **"명절 내에 완성해보자"**였던 만큼, 짧은 기간 안에 완성도를 챙길 수 있는 방법을 선택해야 했다. 그래서 자연스럽게 **Next.js**를 사용하는 방식으로 방향을 잡았다.

![image.png](attachment:e06fcaed-b8f8-4b26-88bf-598ef8aabf31:image.png)

준일님이 재미있는 아이디어도 주셨지만… 이번에는 시간과 목표를 고려해 다음 기회에 적용해보기로 했다.

그리고 준형님이 알려주신 하조은님의 ["**Vercel 기술 블로그 아키텍처 뜯어보기**"](https://www.youtube.com/watch?v=LlG-B2TF_Ug) 영상이 정말 큰 도움이 됐다.

# 그래서 어떻게 만들건데?

블로그를 만드는 과정은 크게 이렇게 정리할 수 있다.

```jsx
콘텐츠 저장소 → GET → 데이터 파싱/처리 → 정적 페이지 생성 → 배포
```

여기서 가장 고민했던 부분은 **"콘텐츠를 어떻게 관리할까?"**였다.

짧은 기간 안에 블로그를 완성하려면, 단순히 페이지를 띄우는 것만이 아니라 글을 쓰고, 쓴 글을 관리하고, 기술적으로도 의미 있는 구조를 만들어야 했다.

그래서 세 가지 기준을 세웠다.

1. **글 작성 경험이 좋아야 한다.**

   → 글을 쓰는 과정이 귀찮거나 번거로워선 안 된다.

2. **유지보수는 편해야 한다.**

   → 글을 추가하거나 수정할 때 최소한의 작업으로 반영되어야 한다.

3. **기술적으로 도전해볼만한 과제가 있어야 한다.**

   → 단순히 가져다 쓰는 구조가 아니라, 구현 과정에서 개발자로서 배울 수 있는 요소가 있어야 한다.

결국, **콘텐츠 저장소를 어떻게 선택하느냐가 이 세 가지 목표를 만족시키는 핵심 관심사**였다.

아래는 내가 고민한 3가지의 방법이다.

## 1. MDX 방식

가장 간단하고 익숙한 방식이다. `/post` 폴더 안에서 `.mdx` 파일을 넣어두고 빌드 타임에 이를 읽어서 정적 페이지로 변환하면 된다. 하지만 콘텐츠를 repo 안에서 관리해야하다보니

1. **글 작성 경험은 좋은가?** ❌

   → 매번 IDE에서 글을 작성해야하거나, 노션에서 따로 옮겨서 복붙하는 구조로 작성해야했다.

2. **유지보수는 편한가?** ❌

   → 글 하나 작성/수정할 때마다 커밋 + 배포를 해야 한다.

결국 두가지 조건을 만족하지 못해서 과감히 PASS 했다.

## 2. Github repo를 DB로 쓰기

두번째 아이디어는 Github repo를 DB로 쓰는 아이디어였는데 이 아이디어는 찬규가 제시해줬다.

![image.png](attachment:581accdf-8daf-46ad-9c0d-c86abaeb5afd:image.png)

개념상으로는 꽤 흥미로웠다. Github repo를 DB로 사용해서 콘텐츠를 repo에 올려두고 Next에서는 Github API를 활용해서 데이터를 가지고 오는 구조였다.

하지만 개인적인 생각으로

1. **글 작성 경험은 좋은가?** ❌

   → 이것 역시 github repo에서 바로 작성을 해서 올리거나, IDE를 켜서 작성을 해야한다. 혹은 다른 CMS에서 콘텐츠를 작성하고 복붙하는 방식으로 활용해야한다.

2. **유지보수는 편한가?** 🔺

   → 인증 토큰, API rate limit, 캐시 처리 등 신경써야하는 부분들이 몇 가지 존재했다.

## 3. Notion을 DB로 쓰기 (채택)

최종적으로 채택한 방식은 Notion을 DB로 사용하는 방법이였다.

그 이유는 평소 회고나 기술블로그를 쓸 때 노션을 자주 사용했기 때문에 글쓰기 경험이 익숙하고 편리했다.

또한 **이미지 만료 관련된 이슈**들이 존재했어서 이 부분도 기술적으로 해결해보면 재밌을것 같다는 생각을 했다.

# 콘텐츠 저장소를 Notion으로 써보자!

## Headless CMS

우선 블로그 콘텐츠를 Notion에서 관리할 수 있게 테이블을 설계했다.

![image.png](attachment:850810a7-8d72-4300-af72-cef92d423014:image.png)

위 그림처럼 `published`라는 체크박스를 만들어서 새로운 콘텐츠를 배포하는 식으로 간단하게 구현했고 코드상으로는 `published`가 `true`인 콘텐츠만 가지고 오는 방식으로 구현했다.

이 방식 덕분에 글을 쓰는 환경과 여러 콘텐츠에 대한 관리(임시 작성용이라던지, 수정 중인 콘텐츠)를 Notion 내에서 바로 해결하여 **Headless CMS** 환경을 구축할 수 있었다.

## 마크다운 파서 만들기

사실 정확히 말하면 "마크다운 파서"라기보다는 **"Notion 블록 파서"**를 만든 것이다. Notion API는 콘텐츠를 마크다운이 아닌 **블록(Block) 단위**로 반환하기 때문에, 이를 우리가 원하는 형태로 변환하는 작업이 필요했다.

### Notion 블록 구조 이해하기

Notion API에서 받아오는 데이터는 대략 이런 구조다:

```typescript
{
  id: "block-id",
  type: "paragraph",  // heading_1, code, image 등
  paragraph: {
    rich_text: [
      {
        plain_text: "실제 텍스트",
        annotations: { bold: true, italic: false, ... },
        href: null
      }
    ]
  }
}
```

각 블록 타입(`paragraph`, `heading_1`, `code`, `image` 등)마다 데이터 구조가 다르기 때문에 이를 **일관되게 처리할 수 있는 파싱 레이어**가 필요했다.

### 3단계 파싱 전략

나는 Notion 블록을 React 컴포넌트로 렌더링하기 위해 **3단계 파싱 전략**을 사용했다.

```
1. API 호출 → 2. 블록 파싱 → 3. 렌더링
```

#### 1단계: Notion API에서 블록 가져오기

```typescript
// src/features/notion/api/client.ts
export async function getPostBlocks(pageId: string): Promise<NotionBlock[]> {
  const allBlocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  // 모든 블록을 페이지네이션으로 가져오기
  while (hasMore) {
    const response = await getClient().blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });

    const blocks = response.results.map((block) => {
      const notionBlock = block as NotionBlockType;
      return {
        id: notionBlock.id,
        type: notionBlock.type,
        content: extractBlockContent(notionBlock),
        children: notionBlock.has_children ? [] : undefined,
      };
    });

    allBlocks.push(...blocks);

    hasMore = response.has_more;
    cursor = response.next_cursor || undefined;
  }

  return allBlocks;
}
```

**포인트:**

- Notion API는 한 번에 최대 100개 블록만 반환하므로 **페이지네이션 처리** 필요
- 각 블록에서 핵심 정보만 추출하여 통일된 인터페이스로 변환

#### 2단계: 블록 타입별 데이터 추출 (Parser)

```typescript
// src/features/notion/utils/blockParser.ts

/**
 * Notion 블록의 content에서 순수 텍스트를 추출
 */
export function extractText(content: NotionBlock["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "object" && content !== null) {
    const textContent = content as TextContent;

    if ("text" in textContent && textContent.text) {
      return textContent.text;
    }

    if ("rich_text" in textContent && textContent.rich_text) {
      return textContent.rich_text.map((item: RichTextItem) => item.plain_text || "").join("");
    }
  }

  return "";
}

/**
 * Rich text 배열 추출 (볼드, 이탤릭 등 스타일 정보 포함)
 */
export function extractRichTextArray(content: NotionBlock["content"]): RichTextItem[] {
  if (typeof content === "object" && content !== null) {
    const textContent = content as TextContent;

    if ("rich_text" in textContent && textContent.rich_text) {
      return textContent.rich_text;
    }
  }

  return [];
}
```

**포인트:**

- 블록 타입마다 다른 데이터 구조를 **일관된 형태로 추출**
- `rich_text` 배열에서 볼드, 이탤릭, 링크 등 스타일 정보 보존

#### 3단계: 렌더링 가능한 형태로 매핑 (Mapper)

```typescript
// src/features/notion/utils/blockMapper.ts

export function parseNotionBlock(block: NotionBlock): ParsedBlock {
  const { type, content } = block;
  const richText = extractRichTextArray(content);
  const fallbackText = extractText(content);

  switch (type) {
    case "paragraph":
      return {
        type: "paragraph",
        richText,
        fallbackText,
      };

    case "heading_1":
    case "heading_2":
    case "heading_3":
      return {
        type,
        richText,
        fallbackText,
        level: parseInt(type.split("_")[1]) as 1 | 2 | 3,
      };

    case "code":
      return {
        type: "code",
        code: fallbackText,
        language: extractLanguage(content),
      };

    case "image":
      const { url, caption } = extractImageData(content);
      return {
        type: "image",
        url,
        caption,
      };

    // ... 다른 블록 타입들
  }
}
```

**포인트:**

- 블록 타입별로 **필요한 데이터만 정제**하여 반환
- React 컴포넌트에서 바로 사용 가능한 깔끔한 인터페이스 제공

#### 4단계: React 컴포넌트로 렌더링

```typescript
// src/features/notion/components/NotionBlockRenderer.tsx

export function NotionBlockRenderer({ block, headingId }: NotionBlockRendererProps) {
  const parsed = parseNotionBlock(block);

  const renderContent = () => {
    if ("richText" in parsed && parsed.richText.length > 0) {
      return <RichTextRenderer items={parsed.richText} />;
    }
    return null;
  };

  // 빈 paragraph 블록인 경우 체크
  const isEmpty = "richText" in parsed && parsed.richText.length === 0;

  switch (parsed.type) {
    case "paragraph":
      // 빈 줄바꿈 블록도 공간을 차지하도록 처리 (Notion과 동일하게)
      if (isEmpty) {
        return <p className="mb-2 leading-relaxed" style={{ minHeight: "1em" }}></p>;
      }
      return <p className="mb-2 leading-relaxed text-gray-700 dark:text-gray-300">{renderContent()}</p>;

    case "heading_1":
      return (
        <h1 id={headingId} className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          {renderContent()}
        </h1>
      );

    case "code":
      return <CodeBlock code={parsed.code} language={parsed.language} />;

    case "image":
      return <ImageBlock url={parsed.url} caption={parsed.caption} />;

    // ... 다른 블록 타입들
  }
}
```

**포인트:**

- 파싱된 데이터를 받아서 **React 컴포넌트로만 변환**하는 역할
- 빈 줄바꿈 블록도 Notion과 동일하게 `minHeight: 1em` 적용하여 공간 유지
- 각 블록 타입에 맞는 스타일링 적용

### 왜 이렇게 나눴을까?

처음에는 "그냥 한 번에 처리하면 되지 않을까?"라고 생각했다. 하지만 실제로 구현해보니 **관심사 분리(Separation of Concerns)**가 정말 중요했다.

| 레이어                                 | 역할                                 | 장점                               |
| -------------------------------------- | ------------------------------------ | ---------------------------------- |
| **API (client.ts)**                    | Notion API 호출 및 페이지네이션 처리 | API 변경 시 여기만 수정            |
| **Parser (blockParser.ts)**            | 블록 타입별 데이터 추출              | 새로운 블록 타입 추가 시 확장 용이 |
| **Mapper (blockMapper.ts)**            | 렌더링용 데이터 구조로 변환          | 타입 안정성 확보                   |
| **Renderer (NotionBlockRenderer.tsx)** | UI 렌더링만 담당                     | 스타일 변경 시 여기만 수정         |

이렇게 레이어를 나누니까:

- 버그가 생겼을 때 **어디를 봐야 할지 명확**하고
- 새로운 블록 타입을 추가할 때 **영향 범위가 제한적**이고
- 코드가 **읽기 쉽고 유지보수하기 편해졌다**

### 실제 렌더링 결과

이 파싱 시스템 덕분에 Notion에서 작성한 글이 블로그에 그대로 반영된다.

- ✅ 제목(H1, H2, H3)
- ✅ 텍스트 스타일 (볼드, 이탤릭, 링크, 인라인 코드)
- ✅ 코드 블록 (문법 하이라이팅)
- ✅ 이미지 & 비디오
- ✅ 리스트 (번호, 불릿)
- ✅ 인용구
- ✅ 구분선
- ✅ **빈 줄바꿈** (이 부분이 생각보다 까다로웠다!)

## Notion 이미지 만료 이슈 처리하기

### 문제 상황

Notion API를 사용할 때 가장 큰 문제 중 하나는 **이미지 URL이 1시간 후 만료**된다는 점이었다. Notion에서 제공하는 이미지 URL은 AWS S3의 Signed URL이라 보안상의 이유로 짧은 유효기간을 가지고 있다.

```jsx
// Notion API가 반환하는 이미지 URL 예시
https://prod-files-secure.s3.us-west-2.amazonaws.com/...?X-Amz-Expires=3600
```

이 문제를 해결하는 방법은 크게 세 가지가 있었다:

### 방법 1: 런타임 프록시 서버 방식

Next.js API Route를 만들어서 요청이 올 때마다 Notion 이미지를 프록시하는 방식이다.

```tsx
// app/api/image/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  // Notion 이미지를 가져와서 전달
  const response = await fetch(imageUrl);
  return new Response(response.body);
}
```

**장점:**

- 구현이 간단하다
- 이미지 수정 시 즉시 반영된다

**단점:**

- 매 요청마다 서버를 거쳐야 해서 느리다 (500-1500ms)
- Vercel의 서버리스 함수 실행 시간/비용 증가
- 동시 접속자가 많으면 서버 부하 폭증
- Notion API rate limit에 걸릴 수 있다

### 방법 2: Notion 공개 프록시 URL 방식

Notion이 제공하는 공개 이미지 프록시 서버를 활용하는 방식이다.

```tsx
function convertToPublicNotionImageUrl(notionImageUrl: string, blockId: string): string {
  const baseUrl = notionImageUrl.split("?")[0];
  return `https://www.notion.so/image/${encodeURIComponent(baseUrl)}?table=block&id=${blockId}&cache=v2`;
}
```

**장점:**

- 구현이 매우 간단하다 (URL만 변환)
- 빌드 시간이 빠르다
- 이미지 수정 시 즉시 반영된다

**단점:**

- Notion 서버에 의존적이다 (장애 시 이미지 안 보임)
- Notion이 URL 패턴을 변경하면 동작 안 할 수 있다
- 외부 서버를 거치므로 로딩 속도가 느리다 (200-500ms)
- WebP 같은 최적화가 불가능하다
- Vercel CDN에 제대로 캐싱되지 않을 수 있다

### 방법 3: 빌드 타임 로컬 저장 방식 ✅

빌드 시점에 모든 이미지를 다운로드하고 WebP로 변환해서 `public` 폴더에 저장하는 방식이다.

**장점:**

- **초고속 로딩**: CDN에서 직접 서빙 (10-50ms)
- **완전한 독립성**: Notion 서버 장애와 무관
- **이미지 최적화**: WebP 변환으로 용량 70% 감소
- **서버리스 친화적**: 런타임 처리가 전혀 없음
- **안정성**: URL 패턴 변경 걱정 없음
- **추가 최적화 가능**: 리사이징, blur placeholder 등

**단점:**

- 빌드 시간 증가 (이미지 10개당 약 5-10초)
- 저장 공간 필요 (하지만 `.gitignore` 처리 가능)
- 이미지 수정 시 재빌드 필요

### 최종 선택: 방법 3 (빌드 타임 로컬 저장)

나는 고민 끝에 **방법 3**을 선택했다. 그 이유는:

#### 1. 성능이 압도적으로 중요하다

블로그의 핵심은 **글을 읽는 경험**이다. 이미지 로딩이 느리면 독자가 떠날 확률이 높아진다.

- 방법 1: 500-1500ms (서버 거침)
- 방법 2: 200-500ms (Notion 프록시)
- 방법 3: 10-50ms (CDN 직접) ✅

특히 한 글에 이미지가 10개 이상 있다면, 방법 3은 **전체 로딩 시간을 수 초 단축**시킬 수 있다.

#### 2. Vercel의 서버리스 환경에 최적화

Vercel은 서버리스 함수에 대해 실행 시간과 대역폭으로 과금한다. 방법 1처럼 매번 이미지를 프록시하면:

- 함수 실행 시간 증가
- 대역폭 사용량 증가
- 트래픽이 늘면 비용 폭증 가능

하지만 방법 3은 빌드 시 1회만 처리하므로 **런타임 비용이 0원**이다.

#### 3. WebP 변환으로 추가 최적화

단순히 이미지를 저장하는 것을 넘어, **빌드 시점에 WebP로 변환**할 수 있다는 게 큰 장점이었다.

- 원본 PNG: 500KB
- WebP 85% 품질: 150KB (70% 감소)
- 화질은 거의 동일

이는 **모바일 사용자의 데이터 사용량을 크게 절약**하고, Lighthouse 점수도 높일 수 있다.

#### 4. 안정성과 독립성

Notion 서버가 다운되거나, URL 패턴이 바뀌거나, API rate limit에 걸려도 **내 블로그 이미지는 영향을 받지 않는다**. 이는 프로덕션 환경에서 매우 중요한 요소다.

#### 5. 빌드 시간 증가는 감수할 만하다

이미지 변환으로 빌드 시간이 30초~1분 정도 늘어나지만:

- 하루에 빌드는 많아야 5-10번
- 독자들은 매일 수백 명이 방문
- **독자의 경험 > 개발자의 빌드 시간**

더군다나 이미 변환된 이미지는 스킵하므로, 새 글을 올릴 때만 추가 시간이 발생한다.

#### 결론

방법 1, 2는 빠르게 프로토타입을 만들 때는 좋지만, **프로덕션 블로그**에는 방법 3이 압도적으로 유리했다. 초기 설정이 조금 복잡하더라도, **장기적으로 성능, 비용, 안정성 모두에서 이득**이 크다고 판단했다.

### 빌드 타임 이미지 최적화 시스템 구축

#### 1단계: 이미지 변환 스크립트 작성

먼저 Notion 이미지를 다운로드하고 WebP로 변환하는 유틸리티를 만들었다.

```tsx
// scripts/convertImages.ts
export async function convertImageToWebp(
  url: string,
  postSlug: string,
  imageIndex: number,
  quality = 85
): Promise<string> {
  const fileName = `${imageIndex}.webp`;
  const outputDir = path.join(process.cwd(), "public", "images", postSlug);
  const outputPath = path.join(outputDir, fileName);

  // 이미 변환된 이미지가 있으면 스킵 (빌드 속도 최적화)
  if (fs.existsSync(outputPath)) {
    return `/images/${postSlug}/${fileName}`;
  }

  // Notion 이미지 다운로드
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // WebP로 변환 및 저장 (Sharp 라이브러리 사용)
  await sharp(buffer).webp({ quality }).toFile(outputPath);

  return `/images/${postSlug}/${fileName}`;
}
```

이렇게 하면 포스트별로 폴더를 만들어서 이미지를 순서대로 저장할 수 있다.

```
public/
└── images/
    ├── javascript-promise-8618d667c89b3708/
    │   ├── 1.webp
    │   ├── 2.webp
    │   └── 3.webp
    └── server-sent-events-2842acd723138040/
        └── 1.webp
```

#### 2단계: 빌드 프로세스 자동화

빌드 시 자동으로 모든 포스트의 이미지를 변환하는 스크립트를 작성했다.

```tsx
// scripts/buildImages.ts
async function main() {
  // 1. 모든 포스트 가져오기
  const posts = await getAllPosts();

  const allImageMapping = new Map<string, string>();

  for (const post of posts) {
    // 2. 포스트의 이미지 URL 추출 (커버 이미지 + 콘텐츠 이미지)
    const imageUrls = await extractPostImageUrls(post.id, post.slug, post.coverImage);

    if (imageUrls.length === 0) continue;

    // 3. 이미지 변환 (WebP, 85% 품질)
    const postMapping = await convertPostImages(post.slug, imageUrls, 85);

    // 4. URL 매핑 정보 저장
    postMapping.forEach((localPath, url) => {
      allImageMapping.set(url, localPath);
    });
  }

  // 5. 매핑 정보를 TypeScript 파일로 생성
  saveImageMapping(allImageMapping);
}
```

이 스크립트는 다음 작업들을 자동으로 처리한다:

1. Notion API에서 모든 포스트 가져오기
2. 각 포스트의 이미지 URL 추출
3. 이미지 다운로드 & WebP 변환
4. 포스트별 폴더에 저장
5. **원본 URL → 로컬 경로 매핑 정보 저장**

#### 3단계: URL 매핑 시스템

가장 중요한 부분은 **원본 Notion URL을 로컬 WebP 경로로 변환**하는 매핑 시스템이다.

```tsx
// 빌드 시 자동 생성되는 파일
// src/shared/utils/imageMapping.generated.ts
export const IMAGE_MAPPING: Record<string, string> = {
  "https://notion-image-url-1.amazonaws.com/...": "/images/post-slug/1.webp",
  "https://notion-image-url-2.amazonaws.com/...": "/images/post-slug/2.webp",
  // ...
};
```

이 매핑 파일을 활용하는 헬퍼 함수를 만들었다.

```tsx
// src/shared/utils/imageMapper.ts
import { IMAGE_MAPPING } from "./imageMapping.generated";

export function getOptimizedImageUrl(notionUrl: string): string {
  // 매핑에 있으면 로컬 WebP 경로 반환
  if (notionUrl in IMAGE_MAPPING) {
    return IMAGE_MAPPING[notionUrl];
  }

  // 매핑에 없으면 원본 URL 반환 (fallback)
  return notionUrl;
}
```

#### 4단계: 컴포넌트에서 사용하기

이제 ImageBlock 컴포넌트에서 이 함수를 사용하면 자동으로 최적화된 이미지를 불러온다.

```tsx
// src/features/notion/components/blocks/ImageBlock.tsx
export function ImageBlock({ url, caption }: ImageBlockProps) {
  // Notion URL → 로컬 WebP 경로로 자동 변환
  const optimizedImageUrl = getOptimizedImageUrl(url);

  return (
    <figure className="my-6">
      <img
        src={optimizedImageUrl} // 로컬 WebP 사용
        alt={caption || ""}
        loading="lazy"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
```

#### 5단계: package.json 스크립트 설정

마지막으로 빌드 프로세스에 이미지 변환을 포함시켰다.

```json
{
  "scripts": {
    "build:images": "tsx scripts/buildImages.ts",
    "build": "pnpm build:images && next build"
  }
}
```

이제 `pnpm build`만 실행하면:

1. 먼저 모든 이미지를 WebP로 변환하고
2. 그 다음 Next.js 빌드가 실행된다

### 결과

이 시스템 덕분에:

- ⚡ **초고속 이미지 로딩**: CDN에서 직접 서빙
- 📦 **용량 최적화**: WebP 변환으로 이미지 크기 70% 감소
- 🔒 **URL 만료 문제 해결**: 로컬 파일이라 영구적으로 사용 가능
- 🚀 **서버 부하 제로**: 런타임 처리가 아닌 빌드타임 처리

빌드 로그를 보면 이렇게 출력된다:

```bash
🚀 이미지 빌드 프로세스를 시작합니다...

📸 [javascript-promise-8618d667c89b3708] 4개의 이미지 변환 중...
  ✅ 1.webp
  ✅ 2.webp
  ✅ 3.webp
  ✅ 4.webp

💾 이미지 매핑 정보 저장:
   - JSON: public/images/image-mapping.json
   - TS: src/shared/utils/imageMapping.generated.ts

✅ 이미지 빌드 완료!
📊 처리된 포스트: 5개
📸 변환된 이미지: 12개
```

# SEO와 메타데이터

블로그를 만들면서 SEO도 신경을 많이 썼다. 아무리 좋은 글을 써도 검색 엔진에 노출되지 않으면 의미가 없기 때문이다.

Next.js 14의 App Router는 SEO를 위한 강력한 기능들을 제공하는데, 이를 최대한 활용했다.

## 1. 메타데이터 설정

Next.js는 `generateMetadata` 함수를 통해 각 페이지의 메타데이터를 동적으로 생성할 수 있다.

### 루트 레이아웃 메타데이터

먼저 전체 사이트의 기본 메타데이터를 설정했다.

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "프론트엔드 개발자 박창준",
    template: "%s | 박창준 블로그", // 하위 페이지에서 사용
  },
  description:
    "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
  keywords: ["프론트엔드", "개발자", "박창준", "React", "Next.js", "TypeScript", "JavaScript", "웹 개발"],
  authors: [{ name: "박창준" }],
  creator: "박창준",
  metadataBase: new URL(baseUrl), // 모든 상대 URL의 기준
  alternates: {
    types: {
      "application/rss+xml": `${baseUrl}/feed.xml`,
      "application/feed+json": `${baseUrl}/feed.json`,
      "application/atom+xml": `${baseUrl}/atom.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "박창준 블로그",
  },
};
```

### 포스트별 동적 메타데이터

각 포스트 페이지에서는 콘텐츠에 맞는 메타데이터를 동적으로 생성했다.

```tsx
// src/app/posts/[slug]/page.tsx
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const postUrl = `${baseUrl}/posts/${params.slug}`;

  // 설명 자동 생성
  const description =
    post.excerpt ||
    `${post.title}에 대한 상세한 내용을 다룹니다. ${post.category.name} 카테고리의 ${post.readingTime}분 분량의 글입니다.`;

  // 키워드 자동 생성
  const keywords = [
    post.category.name,
    ...post.tags.map((tag) => tag.name),
    "프론트엔드",
    "개발",
    "기술블로그",
    "박창준",
  ];

  return {
    title: `${post.title} | 프론트엔드 개발자 박창준 블로그`,
    description: description.slice(0, 160), // 검색엔진 최적 길이
    keywords: keywords.join(", "),

    // Canonical URL (중복 콘텐츠 방지)
    alternates: {
      canonical: postUrl,
    },

    // Robots 설정 (크롤링 허용)
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Open Graph (소셜 미디어 공유)
    openGraph: {
      type: "article",
      url: postUrl,
      title: post.title,
      description,
      siteName: "프론트엔드 개발자 박창준 블로그",
      locale: "ko_KR",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["박창준"],
      tags: post.tags.map((tag) => tag.name),
      ...(post.coverImage && {
        images: [
          {
            url: post.coverImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      site: "@changjun",
      creator: "@changjun",
      title: post.title,
      description,
      ...(post.coverImage && {
        images: [post.coverImage],
      }),
    },
  };
}
```

## 2. 구조화된 데이터 (JSON-LD)

검색 엔진이 콘텐츠를 더 잘 이해할 수 있도록 **JSON-LD 형식의 구조화된 데이터**를 추가했다.

```tsx
// src/app/posts/[slug]/page.tsx
export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);

  // Schema.org의 BlogPosting 스키마
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: "박창준",
      url: baseUrl,
    },
    publisher: {
      "@type": "Person",
      name: "박창준",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/posts/${params.slug}`,
    },
    keywords: [post.category.name, ...post.tags.map((tag) => tag.name)].join(", "),
    articleSection: post.category.name,
    wordCount: post.content.length * 100,
    timeRequired: `PT${post.readingTime}M`, // ISO 8601 duration format
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* 포스트 콘텐츠 */}
    </>
  );
}
```

이렇게 하면 Google에서 **리치 결과(Rich Results)**로 표시될 가능성이 높아진다. 검색 결과에 작성자, 발행일, 읽기 시간 등이 함께 표시되는 것이다.

## 3. Sitemap 생성

검색 엔진이 내 블로그의 모든 페이지를 쉽게 찾을 수 있도록 동적 사이트맵을 만들었다.

```tsx
// src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // 모든 포스트 가져오기
  const posts = await getAllPosts();

  // 포스트 URL 생성
  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 정적 페이지들
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return [...routes, ...postUrls];
}
```

이제 `/sitemap.xml`로 접근하면 자동으로 생성된 사이트맵을 볼 수 있다.

## 4. robots.txt 설정

검색 엔진 크롤러에게 어떤 페이지를 크롤링해야 하는지 알려주는 `robots.txt`를 설정했다.

```tsx
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: "*", // 모든 검색 엔진 봇 허용
        allow: "/", // 모든 경로 크롤링 허용
        disallow: ["/api/"], // API 경로는 크롤링 차단
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // 사이트맵 위치 알려주기
  };
}
```

## 5. RSS Feed 지원

블로그 구독자를 위해 RSS 피드도 제공했다. `feed` 라이브러리를 사용해서 RSS 2.0, Atom, JSON Feed를 모두 지원한다.

```tsx
// src/app/feed.xml/route.ts
import { Feed } from "feed";
import { getAllPosts } from "@/features/notion";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const feed = new Feed({
    title: "프론트엔드 개발자 박창준",
    description: "프론트엔드 개발자 박창준의 블로그입니다.",
    id: baseUrl,
    link: baseUrl,
    language: "ko",
    image: `${baseUrl}/og-image.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, 박창준`,
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
      json: `${baseUrl}/feed.json`,
      atom: `${baseUrl}/atom.xml`,
    },
    author: {
      name: "박창준",
      link: baseUrl,
    },
  });

  // 모든 포스트를 피드에 추가
  const posts = await getAllPosts();
  const sortedPosts = posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  sortedPosts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${baseUrl}/posts/${post.slug}`,
      link: `${baseUrl}/posts/${post.slug}`,
      description: post.excerpt || post.title,
      date: new Date(post.publishedAt),
      category: [{ name: post.category, term: post.category }, ...post.tags.map((tag) => ({ name: tag, term: tag }))],
      image: post.coverImage,
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
```

이제 독자들이 `/feed.xml`, `/feed.json`, `/atom.xml`을 통해 블로그를 구독할 수 있다.

## 6. 정적 생성 (SSG) 최적화

SEO를 위해서는 서버 사이드에서 완전한 HTML을 생성하는 것이 중요하다. Next.js의 Static Site Generation을 활용했다.

```tsx
// src/app/posts/[slug]/page.tsx
export const dynamic = "force-static"; // 정적 생성 강제
export const revalidate = 3600; // 1시간마다 재검증

// 빌드 타임에 모든 포스트 페이지 생성
export async function generateStaticParams() {
  const allPosts = await getAllPosts();

  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}
```

이렇게 하면:

- 빌드 시점에 모든 포스트 페이지가 정적 HTML로 생성됨
- 검색 엔진 크롤러가 완전한 HTML을 바로 받을 수 있음
- 페이지 로딩 속도가 매우 빠름 (Lighthouse 점수 ↑)

## 결과

이런 SEO 최적화 작업들을 통해:

- ✅ **Google Search Console 등록**: 사이트맵 제출 완료
- ✅ **리치 결과 지원**: 검색 결과에 메타 정보 표시
- ✅ **소셜 미디어 최적화**: 링크 공유 시 예쁜 카드 표시
- ✅ **RSS 구독 지원**: 독자들이 편하게 구독 가능
- ✅ **빠른 인덱싱**: 새 글 발행 시 빠르게 검색 엔진에 반영

SEO는 한번 설정해두면 자동으로 동작하기 때문에, 이제 글 쓰는 것에만 집중할 수 있게 되었다.
