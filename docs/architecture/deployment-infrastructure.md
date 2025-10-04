# 배포 및 인프라 아키텍처

## GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy Blog

on:
  schedule:
    - cron: "0 * * * *" # 매시간 실행
  workflow_dispatch: # 수동 실행 가능

jobs:
  check-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check Notion Changes
        run: |
          # Notion API로 변경사항 확인
          node scripts/check-notion-changes.js
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}

  build-and-deploy:
    needs: check-changes
    if: steps.check-changes.outputs.has-changes == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 환경 변수 관리

```bash
# .env.local (로컬 개발)
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Vercel 환경 변수 (프로덕션)
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=xxxxx
NEXT_PUBLIC_SITE_URL=https://yourblog.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
