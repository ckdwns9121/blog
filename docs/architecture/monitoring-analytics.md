# 모니터링 및 분석

## 성능 모니터링

```typescript
// lib/analytics.ts
import { Analytics } from "@vercel/analytics/react";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

## 에러 추적

```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context?: any) {
  console.error("Error tracked:", error, context);
  // 향후 Sentry 등 에러 추적 서비스 연동 가능
}
```
