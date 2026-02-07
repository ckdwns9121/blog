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

| Secret 이름 | 설명 | 필수 여부 |
|------------|------|-----------|
| `GEMINI_API_KEY` | Google Gemini API 키 | 필수 |
| `APP_ID` | GitHub App ID | 선택 (App 사용 시) |
| `APP_PRIVATE_KEY` | GitHub App Private Key | 선택 (App 사용 시) |
| `APP_INSTALLATION_ID` | GitHub App Installation ID | 선택 (App 사용 시) |

**참고**: `GITHUB_TOKEN`은 GitHub Actions에서 자동으로 제공됩니다.

### 3. Gemini API 키 발급 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 새 API 키 생성 또는 기존 프로젝트 선택
4. 생성된 API 키를 복사하여 GitHub Secret `GEMINI_API_KEY`에 등록

### 4. GitHub App 설정 (changjun-test-bot으로 리뷰를 남길 때)

리뷰가 `changjun-test-bot`으로 달리게 하려면 GitHub App 인증을 설정해야 합니다.

#### 4-1. GitHub App 정보 확인

https://github.com/organizations/ckdwns9121/settings/apps/changjun-test-bot

또는 개인 계정의 Apps 페이지에서 확인:
https://github.com/settings/apps

#### 4-2. App ID, Private Key, Installation ID 확인

**App ID**: App 설정 페이지 상단에 표시됨 (예: `123456`)

**Private Key**:
1. App 설정 페이지 하단의 "Private keys" 섹션
2. "Generate a private key" 클릭
3. `.pem` 파일 다운로드
4. 파일 내용을 복사 (````-----BEGIN RSA PRIVATE KEY-----` 로 시작)

**Installation ID**:
```
curl -X GET \
  -H "Authorization: Bearer YOUR_GITHUB_PAT" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/users/ckdwns9121/installations
```

또는 Octokit을 사용해서 확인:
```typescript
const octokit = new Octokit({ auth: 'your-pat' });
const installations = await octokit.rest.apps.listInstallationsForAuthenticatedUser();
console.log(installations.data[0].id);
```

#### 4-3. GitHub Secrets 등록

Secret을 등록할 때 Private Key의 `\n`을 그대로 입력하세요 (예: `-----BEGIN RSA PRIVATE KEY-----\nMIIE...`).

## 작동 방식

1. PR이 생성/수정될 때마다 GitHub Actions가 트리거됩니다
2. 변경된 파일들의 diff를 가져옵니다
3. Gemini AI가 코드 변경사항을 분석하고 리뷰를 생성합니다
4. 생성된 리뷰가 PR 댓글로 자동 포스팅됩니다

## 인증 방식 비교

| 방식 | 댓글 작성자 | 설정 난이도 | 권한 |
|------|-------------|-------------|------|
| `GITHUB_TOKEN` | `github-actions` | 쉬움 | 자동 제공 |
| GitHub App | `changjun-test-bot` | 어려움 | App 권한에 따름 |

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

# GitHub App 사용 시 (선택)
APP_ID=your_app_id
APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
APP_INSTALLATION_ID=your_installation_id
```

그 다음 실행:

```bash
pnpm pr-review
```

## 커스터마이징

### 모델 변경

`scripts/pr-review/index.ts`에서 모델을 변경할 수 있습니다:

```typescript
new GeminiReviewer(GEMINI_API_KEY, 'gemini-2.5-flash') // 기본값
// 또는
new GeminiReviewer(GEMINI_API_KEY, 'gemini-2.5-pro')
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

### GitHub App 인증 실패

1. Private Key가 올바르게 등록되었는지 확인 (`\n`이 포함되어야 함)
2. Installation ID가 올바른지 확인
3. App에 필요한 권한이 있는지 확인 (Pull requests: Read & Write)
