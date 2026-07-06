"use client";

import { useMemo } from "react";
import {
  Header,
  createLogoPlugin,
  createNavigationPlugin,
  createSearchPlugin,
  createMobileSearchPlugin,
  createThemeTogglePlugin,
} from "@/shared/ui";
import type { HeaderPlugin } from "@/shared/ui";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // 헤더 플러그인 생성
  const headerPlugins: HeaderPlugin[] = useMemo(
    () => [createLogoPlugin(), createNavigationPlugin(), createSearchPlugin(), createThemeTogglePlugin()],
    []
  );

  // 모바일 전용 플러그인
  const mobileHeaderPlugins: HeaderPlugin[] = useMemo(() => [createMobileSearchPlugin()], []);

  return (
    <>
      <Header plugins={headerPlugins} mobilePlugins={mobileHeaderPlugins} />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
