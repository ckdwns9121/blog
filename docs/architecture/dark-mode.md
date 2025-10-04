# 다크모드 아키텍처

## 테마 관리 시스템

```typescript
// lib/themes.ts
import { ThemeProvider } from "next-themes";

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange={false}>
      {children}
    </ThemeProvider>
  );
}

// hooks/useTheme.ts
export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
```

## CSS 변수 기반 테마 시스템

```css
/* globals.css */
:root {
  --background: #ffffff;
  --foreground: #0f0f23;
  --primary: #3b82f6;
  --secondary: #64748b;
  --muted: #f1f5f9;
  --border: #e2e8f0;
}

.dark {
  --background: #0f0f23;
  --foreground: #f9fafb;
  --primary: #60a5fa;
  --secondary: #94a3b8;
  --muted: #1e293b;
  --border: #334155;
}
```
