# Next.js + Notion 기술블로그 이미지 만료 시간 문제 해결기

## 🔥 문제 상황

Next.js와 Notion API를 활용하여 기술 블로그를 구축하던 중, 치명적인 문제를 발견했습니다.

블로그에 업로드된 이미지들이 **1시간 후에 모두 깨지는** 현상이 발생한 것입니다.

```
❌ Failed to load image
   https://prod-files-secure.s3.us-west-2.amazonaws.com/.../image.png?X-Amz-Algorithm=...
```

개발 환경에서는 정상적으로 보이던 이미지들이 프로덕션 배포 후 시간이 지나면서 하나둘씩 깨지기 시작했습니다.

## 🔍 원인 분석

### Notion API의 Signed URL 방식

문제의 근본 원인은 Notion API가 이미지를 제공하는 방식에 있었습니다.

1. **Notion API 응답 구조**

   ```typescript
   {
     type: "image",
     image: {
       type: "file",
       file: {
         url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/..."
       }
     }
   }
   ```

2. **Signed URL의 특징**

   - Notion은 내부 이미지를 AWS S3에 저장합니다
   - API를 통해 받는 URL은 **임시 접근 토큰이 포함된 Signed URL**입니다
   - 이 URL은 보안을 위해 **1시간 후 자동으로 만료**됩니다

3. **정적 사이트의 딜레마**
   ```
   빌드 시점 → 이미지 URL 생성 (만료: 1시간)
                      ↓
   사용자 방문 (2시간 후) → ❌ URL 만료로 이미지 깨짐
   ```

### 왜 이 문제가 심각한가?

- **SSG (Static Site Generation)**: Next.js에서 빌드 시점에 페이지를 생성하면, 그 시점의 URL이 HTML에 박혀버립니다
- **CDN 캐싱**: 프로덕션 환경에서는 빌드된 페이지가 CDN에 캐싱되어 오래 사용됩니다
- **재빌드 필요**: 이미지를 보려면 계속 재빌드해야 하는 악순환이 발생합니다

## 💡 해결 과정

### 1단계: 다양한 해결책 검토

처음에는 여러 방법을 고민했습니다:

| 방법                     | 장점            | 단점                      | 결정 |
| ------------------------ | --------------- | ------------------------- | ---- |
| ISR로 주기적 재생성      | 자동화 가능     | 서버 비용, 복잡도 증가    | ❌   |
| 이미지를 로컬에 다운로드 | 완전한 제어     | 빌드 시간 증가, 저장 공간 | ❌   |
| Notion 공개 프록시 활용  | 간단, 비용 없음 | Notion 의존성             | ✅   |

### 2단계: Notion 공개 페이지 패턴 분석

Notion의 공개 페이지를 개발자 도구로 분석한 결과, 특별한 URL 패턴을 발견했습니다:

```
# Notion이 공개 페이지에서 사용하는 실제 URL
https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F...%2Fimage.png
?table=block&id={blockId}&spaceId={workspaceId}&cache=v2
```

**핵심 발견:**

- Notion은 자체 이미지 프록시 엔드포인트를 제공합니다
- 공개 페이지는 이 프록시를 통해 이미지를 제공합니다
- 이 URL은 **만료 시간이 없거나 훨씬 깁니다**

### 3단계: URL 변환 로직 구현

```typescript
/**
 * Notion S3 이미지 URL을 Notion의 공개 이미지 프록시 URL로 변환
 */
private convertToPublicNotionImageUrl(
  notionImageUrl: string,
  blockId: string
): string {
  // 1. 외부 URL은 변환하지 않음
  if (!notionImageUrl.includes("prod-files-secure.s3") &&
      !notionImageUrl.includes("s3.us-west-2.amazonaws.com")) {
    return notionImageUrl;
  }

  // 2. Signed URL의 쿼리 파라미터 제거 (만료 토큰 제거)
  const baseUrl = notionImageUrl.split("?")[0];

  // 3. Workspace ID 추출
  const workspaceIdMatch = baseUrl.match(/amazonaws\.com\/([^/]+)\//);
  const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : "";

  // 4. Notion 공개 이미지 프록시 URL 생성
  const encodedUrl = encodeURIComponent(baseUrl);

  if (workspaceId) {
    return `https://www.notion.so/image/${encodedUrl}?table=block&id=${blockId}&spaceId=${workspaceId}&cache=v2`;
  }

  return `https://www.notion.so/image/${encodedUrl}?table=block&id=${blockId}&cache=v2`;
}
```

### 4단계: 모든 이미지 처리 지점에 적용

```typescript
// 1. 이미지 블록 처리
case "image": {
  const imageUrl = block.image.external?.url || block.image.file?.url || "";
  const publicUrl = imageUrl
    ? this.convertToPublicNotionImageUrl(imageUrl, block.id)
    : "";
  return {
    type: "image" as const,
    url: publicUrl,
    caption: this.extractText(block.image.caption || []),
  };
}

// 2. 커버 이미지 처리
const rawCoverImage = this.getUrl(properties.coverImage);
const coverImage = rawCoverImage
  ? this.convertToPublicNotionImageUrl(rawCoverImage, notionPage.id)
  : undefined;

// 3. 비디오 블록 처리
case "video": {
  const videoUrl = block.video.external?.url || block.video.file?.url || "";
  const publicVideoUrl = videoUrl
    ? this.convertToPublicNotionImageUrl(videoUrl, block.id)
    : "";
  return {
    type: "image" as const,
    url: publicVideoUrl,
    caption: this.extractText(block.video.caption || []),
  };
}
```

### 5단계: Next.js 설정 업데이트

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.notion.so",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};
```

## 🐛 트러블슈팅 과정

### 시행착오 1: URL 인코딩 문제

**문제:**

```typescript
// ❌ 잘못된 방법
const url = `https://www.notion.so/image/${baseUrl}`;
// 결과: URL 파싱 오류 발생
```

**해결:**

```typescript
// ✅ 올바른 방법
const encodedUrl = encodeURIComponent(baseUrl);
const url = `https://www.notion.so/image/${encodedUrl}`;
```

### 시행착오 2: Block ID vs Page ID

**문제:**

- 처음에는 모든 이미지에 Page ID를 사용했습니다
- 일부 이미지가 로드되지 않는 현상 발견

**해결:**

```typescript
// ✅ 각 이미지는 고유한 Block ID를 사용해야 함
case "image": {
  // block.id 사용 (not pageId)
  this.convertToPublicNotionImageUrl(imageUrl, block.id)
}

// ✅ 커버 이미지는 Page ID 사용
const coverImage = this.convertToPublicNotionImageUrl(
  rawCoverImage,
  notionPage.id  // pageId 사용
);
```

### 시행착오 3: Workspace ID 추출

**문제:**

- 초기에는 workspace ID를 하드코딩했습니다
- 다른 Notion workspace에서는 작동하지 않았습니다

**해결:**

```typescript
// ✅ URL에서 동적으로 추출
const workspaceIdMatch = baseUrl.match(/amazonaws\.com\/([^/]+)\//);
const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : "";
```

### 시행착오 4: 외부 이미지 처리

**문제:**

- 모든 이미지를 변환하려고 시도
- 외부 URL (imgur, unsplash 등)이 깨짐

**해결:**

```typescript
// ✅ Notion S3 URL인 경우에만 변환
if (!notionImageUrl.includes("prod-files-secure.s3") && !notionImageUrl.includes("s3.us-west-2.amazonaws.com")) {
  return notionImageUrl; // 외부 URL은 그대로 반환
}
```

## ✅ 결과

### 성과

✅ **영구적인 이미지 URL**: 1시간 후에도 이미지가 정상 표시됩니다  
✅ **재빌드 불필요**: 한 번 빌드하면 계속 작동합니다  
✅ **서버 비용 제로**: Notion의 인프라를 활용하므로 추가 비용이 없습니다  
✅ **간단한 구현**: 복잡한 이미지 파이프라인 없이 함수 하나로 해결

### Before & After

#### Before (Signed URL)

```
빌드 → 이미지 정상 (1시간)
   ↓
   ❌ 이미지 깨짐 (1시간 후)
   ↓
재빌드 필요 (무한 반복)
```

#### After (Public Proxy URL)

```
빌드 → 이미지 정상
   ↓
   ✅ 이미지 정상 (시간 제한 없음)
   ↓
행복한 블로그 운영 🎉
```

### 실제 URL 비교

**변환 전:**

```
https://prod-files-secure.s3.us-west-2.amazonaws.com/
workspace-id/file-id/image.png
?X-Amz-Algorithm=AWS4-HMAC-SHA256
&X-Amz-Expires=3600  ⬅️ 1시간 만료!
```

**변환 후:**

```
https://www.notion.so/image/
https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F...
?table=block&id=block-id&spaceId=workspace-id&cache=v2
⬅️ 만료 시간 없음!
```

## ⚠️ 주의사항

### 1. Notion 페이지 공개 설정

이 방법은 **Notion 페이지가 "Share to web"으로 공개되어 있어야** 작동합니다.

```
Notion 페이지 → Share → Share to web (ON)
```

비공개 페이지의 이미지는 프록시를 통해서도 접근할 수 없습니다.

### 2. Notion API 정책 의존성

이 해결책은 Notion의 공개 이미지 프록시 엔드포인트를 활용합니다.
Notion이 이 엔드포인트의 정책을 변경하면 영향을 받을 수 있습니다.

**대응 방안:**

- 주기적으로 이미지 로딩 상태 모니터링
- 필요 시 이미지 로컬 저장 방식으로 전환할 준비

### 3. 이미지 최적화

Notion 프록시는 원본 이미지를 제공합니다.
추가 최적화가 필요한 경우:

```typescript
// Option 1: Next.js Image 컴포넌트 활용
<Image
  src={notionImageUrl}
  width={800}
  height={600}
  quality={80} // 자동 최적화
/>

// Option 2: Cloudflare Images 등 별도 CDN 사용
```

## 📚 참고 자료

- [Notion API Documentation](https://developers.notion.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [AWS S3 Signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)

## 💭 결론

Notion API와 Next.js를 함께 사용할 때 이미지 만료 문제는 매우 흔한 이슈입니다.
하지만 Notion이 공개 페이지에서 사용하는 패턴을 활용하면 복잡한 인프라 없이도
우아하게 해결할 수 있습니다.

핵심은 **Notion의 공개 이미지 프록시 엔드포인트**를 활용하는 것이었습니다.

```typescript
// 마법의 한 줄
return `https://www.notion.so/image/${encodedUrl}?table=block&id=${blockId}&cache=v2`;
```

이 작은 변화로 더 이상 이미지 만료를 걱정하지 않고 블로그를 운영할 수 있게 되었습니다! 🚀

---

**작성일:** 2025-10-09  
**태그:** `#NextJS` `#Notion` `#Troubleshooting` `#ImageOptimization`
