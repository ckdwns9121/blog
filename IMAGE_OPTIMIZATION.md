# 📸 이미지 최적화 가이드

## 개요

Notion 블로그의 이미지를 **빌드 시점에 WebP로 변환**하여 최적화하는 시스템입니다.

### 📊 방식 비교

| 방식            | 런타임 API  | 정적 빌드 (현재) |
| --------------- | ----------- | ---------------- |
| 변환 시점       | 매 요청마다 | 빌드 시 1회      |
| 성능            | 느림        | 빠름 ⚡          |
| 서버 부하       | 높음        | 없음             |
| CDN 캐싱        | 가능        | 가능 ✅          |
| 이미지 업데이트 | 즉시 반영   | 재빌드 필요      |

## 🚀 사용 방법

### 1. 이미지 빌드

```bash
# 이미지만 변환
pnpm build:images

# 전체 빌드 (이미지 변환 + Next.js 빌드)
pnpm build
```

### 2. 빌드 과정

```
1. 모든 Notion 포스트 가져오기
   ↓
2. 이미지 URL 추출 (커버 이미지 + 콘텐츠 이미지)
   ↓
3. 각 이미지를 WebP로 변환 (85% 품질)
   ↓
4. public/images/webp/ 폴더에 저장
   ↓
5. URL 매핑 정보를 image-mapping.json에 저장
```

### 3. 생성된 파일

```
public/
├── images/
│   ├── [post-slug]/                 # 포스트별 이미지 폴더
│   │   ├── 1.webp                  # 첫 번째 이미지
│   │   ├── 2.webp                  # 두 번째 이미지
│   │   └── ...
│   └── image-mapping.json           # 백업용 URL 매핑

src/shared/utils/
└── imageMapping.generated.ts        # TypeScript 매핑 파일 (자동 생성)
```

## 📁 파일 구조

### 1. 이미지 변환 유틸리티 (`scripts/convertImages.ts`)

- `convertImageToWebp()`: 단일 이미지 변환
- `convertImagesInBatch()`: 병렬 배치 변환
- `saveImageMapping()`: 매핑 정보 저장

### 2. 빌드 스크립트 (`scripts/buildImages.ts`)

- Notion 포스트에서 이미지 추출
- 변환 프로세스 실행
- 매핑 정보 저장

### 3. 이미지 매퍼 (`src/shared/utils/imageMapper.ts`)

- `getOptimizedImageUrl()`: Notion URL → 로컬 WebP 경로 변환
- TypeScript 매핑 파일에서 상수를 import하여 사용
- 클라이언트/서버 양쪽에서 모두 사용 가능

### 4. ImageBlock 컴포넌트

```tsx
// 빌드 시점에 변환된 로컬 이미지 사용
const optimizedImageUrl = getOptimizedImageUrl(url);
```

## ⚙️ 설정 커스터마이징

### WebP 품질 조정

`scripts/buildImages.ts`:

```typescript
const imageMapping = await convertImagesInBatch(
  imageUrls,
  85, // 품질 (1-100) - 원하는 값으로 변경
  5 // 동시 변환 수
);
```

### 병렬 처리 수 조정

동시에 변환할 이미지 개수를 늘리면 빌드 속도가 빨라집니다:

```typescript
await convertImagesInBatch(imageUrls, 85, 10); // 5 → 10으로 증가
```

## 🔧 트러블슈팅

### 문제: 이미지가 로드되지 않음

**원인**: 빌드 시 이미지를 변환하지 않음

**해결**:

```bash
pnpm build:images
```

### 문제: NOTION_API_KEY 에러

**원인**: 환경 변수가 설정되지 않음

**해결**:

1. `.env.local` 파일 생성
2. `NOTION_API_KEY=your_key` 추가

### 문제: 새 이미지가 반영되지 않음

**원인**: 이미지 변환 캐시

**해결**:

```bash
# 기존 변환 이미지 삭제 후 재빌드
rm -rf public/images/*/  # 포스트별 폴더 삭제
rm -rf public/images/image-mapping.json src/shared/utils/imageMapping.generated.ts
pnpm build:images
```

## 📈 성능 이점

### Before (API 라우트 방식)

- ❌ 매 요청마다 변환 처리
- ❌ 서버 리소스 사용
- ❌ 변환 시간 발생

### After (정적 빌드 방식)

- ✅ 빌드 시 1회만 변환
- ✅ CDN에서 직접 서빙
- ✅ 초고속 로딩
- ✅ 서버 부하 0

## 🎯 모범 사례

1. **빌드 전 항상 이미지 변환**

   ```bash
   pnpm build  # 자동으로 build:images 실행
   ```

2. **Git에 변환 이미지 제외**

   - `.gitignore`에 이미 추가됨
   - 배포 시 빌드 프로세스에서 자동 생성

3. **CI/CD 파이프라인 설정**
   ```yaml
   # 예: GitHub Actions
   - run: pnpm build:images
   - run: pnpm build
   ```

## 📝 package.json 스크립트

```json
{
  "scripts": {
    "build:images": "tsx scripts/buildImages.ts",
    "build": "pnpm build:images && next build"
  }
}
```

## 🔍 디버깅

### 변환된 이미지 확인

```bash
ls -lh public/images/webp/
```

### 매핑 정보 확인

```bash
cat public/images/image-mapping.json | jq
```

### 변환 로그 확인

빌드 시 상세한 로그가 출력됩니다:

- ✅ 변환 완료
- ⏭️ 이미 변환됨 (캐시)
- ❌ 변환 실패

## 🚀 배포

### Vercel/Netlify

빌드 명령어: `pnpm build`

- 자동으로 이미지 변환 → Next.js 빌드 실행

### 커스텀 서버

```bash
pnpm build:images  # 1. 이미지 변환
pnpm build        # 2. Next.js 빌드
pnpm start        # 3. 서버 실행
```

## 🎨 추가 개선 아이디어

1. **다양한 크기 생성**: 반응형 이미지를 위한 srcset 지원
2. **AVIF 지원**: WebP보다 더 작은 AVIF 포맷 추가
3. **점진적 로딩**: blur placeholder 자동 생성
4. **캐시 무효화**: 이미지 변경 감지 및 자동 재변환
