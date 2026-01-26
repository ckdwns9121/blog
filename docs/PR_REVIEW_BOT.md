# PR Review Bot 설치 가이드

이 봇은 Gemini AI를 사용하여 Pull Request의 코드를 자동으로 리뷰합니다.

## 필수 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. GitHub Secret 설정

Repository Settings → Secrets and variables → Actions → New repository secret

다음 secret을 추가하세요:

| Secret 이름 | 설명 | 값 |
|------------|------|-----|
| `GEMINI_API_KEY` | Google Gemini API 키 | [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급 |

**참고**: `GITHUB_TOKEN`은 GitHub Actions에서 자동으로 제공됩니다. 별도 설정이 필요 없습니다.

### 3. Gemini API 키 발급 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 새 API 키 생성 또는 기존 프로젝트 선택
4. 생성된 API 키를 복사하여 GitHub Secret에 등록

## 작동 방식

1. PR이 생성/수정될 때마다 GitHub Actions가 트리거됩니다
2. 변경된 파일들의 diff를 가져옵니다
3. Gemini AI가 코드 변경사항을 분석하고 리뷰를 생성합니다
4. 생성된 리뷰가 PR 댓글로 자동 포스팅됩니다

## 로컬 테스트

로컬에서 테스트하려면 `.env` 파일에 다음을 추가하세요:

```bash
GITHUB_TOKEN=ghp_xxx (GitHub Personal Access Token)
GEMINI_API_KEY=your_gemini_api_key
PR_NUMBER=1
REPO_OWNER=ckdwns9121
REPO_NAME=blog
BASE_SHA=base_commit_sha
HEAD_SHA=head_commit_sha
```

그 다음 실행:

```bash
pnpm pr-review
```

## 커스터마이징

### 모델 변경

`scripts/pr-review/gemini.ts`에서 모델을 변경할 수 있습니다:

```typescript
new GeminiReviewer(GEMINI_API_KEY, 'gemini-2.0-flash-exp') // 기본값
// 또는
new GeminiReviewer(GEMINI_API_KEY, 'gemini-1.5-pro')
```

### 리뷰 프롬프트 수정

`scripts/pr-review/gemini.ts`의 `REVIEW_PROMPT` 상수를 수정하여 리뷰 스타일을 커스터마이징할 수 있습니다.

## 트러블슈팅

### Permission 오류가 발생할 경우

Repository Settings → Actions → General → Workflow permissions에서
"Read and write permissions"가 선택되어 있는지 확인하세요.

### API Rate Limit

Gemini API의 무료 사용량 제한에 도달하면 유료 플랜으로 업그레이드하거나,
더 적은 파일만 리뷰하도록 코드를 수정할 수 있습니다.
