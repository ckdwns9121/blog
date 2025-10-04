# Notion API 설정 가이드

이 블로그는 Notion을 CMS(Content Management System)로 사용하여 콘텐츠를 관리합니다.

## 1. Notion Integration 생성

1. [Notion Integrations 페이지](https://www.notion.so/my-integrations)로 이동
2. "New integration" 클릭
3. Integration 이름 입력 (예: "개발 기술 블로그")
4. 연결할 워크스페이스 선택
5. "Submit" 클릭
6. 생성된 **Internal Integration Token** 복사 (이것이 `NOTION_API_KEY`가 됩니다)

## 2. Notion 데이터베이스 생성

1. Notion에서 새 페이지 생성
2. 데이터베이스 추가 (/database 입력)
3. 필요한 속성들 추가:

| 속성명      | 타입      | 설명           |
| ----------- | --------- | -------------- |
| title       | 제목      | 포스트 제목    |
| slug        | 텍스트    | URL용 슬래그   |
| published   | 체크박스  | 발행 여부      |
| createdAt   | 날짜      | 생성일         |
| updatedAt   | 날짜      | 수정일         |
| category    | 텍스트    | 카테고리       |
| tags        | 다중 선택 | 태그들         |
| excerpt     | 텍스트    | 포스트 요약    |
| coverImage  | URL       | 커버 이미지    |
| readingTime | 숫자      | 읽기 시간 (분) |

## 3. 데이터베이스 연결 권한 주기

1. 데이터베이스 페이지에서 우측 상단 "..." 클릭
2. "Add connections" 클릭
3. 1단계에서 생성한 integration 선택
4. "Allow" 클릭

## 4. 데이터베이스 ID 복사

1. 데이터베이스 URL 확인: `https://notion.so/xxxxx?v=xxxxx`
2. URL에서 데이터베이스 ID 추출:
   - URL 형태: `https://www.notion.so/{DATABASE_ID}?v={VERSION_ID}`
   - DATABASE_ID는 실제로는 하이픈으로 구분된 32자리 문자열

## 5. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Notion API 설정
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 사이트 설정 (선택사항)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 6. 개발 서버 실행

```bash
npm run dev
```

## 문제 해결

### 환경 변수가 인식되지 않는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 서버를 재시작해보세요: `npm run dev`

### Notion API 오류가 발생하는 경우

1. Integration token이 올바른지 확인
2. 데이터베이스에 연결 권한이 있는지 확인
3. 속성명이 위의 표와 일치する지 확인

### 개발 환경에서 Mock 데이터 사용

환경 변수 설정 없이도 개발을 계속할 수 있습니다. Mock 데이터가 자동으로 사용됩니다.
