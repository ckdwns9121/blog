# 블로그 개선 제안서

## 1. 코드 품질 및 아키텍처

### 1.1 관심사 분리 (Separation of Concerns) ✅

- **잘 된 부분**:

  - Header Plugin 패턴으로 책임 분리 성공
  - 각 기능(검색, 테마 토글 등)이 독립된 플러그인으로 분리
  - UI 컴포넌트와 비즈니스 로직 분리

- **개선 제안**:
  - PostList 컴포넌트에서 필터링과 페이징 로직을 별도 훅으로 분리
  - 검색 로직을 더 세분화하여 useSearch, useSearchResults 등으로 분리

### 1.2 추상화 계층 (Abstraction Layers) ✅

- **잘 된 부분**:

  - Notion API를 Adapter 패턴으로 감싸 CMS 독립성 확보
  - 공통 UI 컴포넌트가 잘 분리됨

- **개선 제안**:
  - 이미지 처리 로직을 ImageProvider 패턴으로 추상화
  - 테마 관련 로직을 ThemeProvider에 더 많은 기능 추가

### 1.3 응집도 (Cohesion) & 결합도 (Coupling) ⚠️

- **문제점**:

  - `layout.tsx`에서 posts를 가져와 여러 컴포넌트에 전달 -> 높은 결합도
  - 검색 기능이 여러 곳에 의존

- **개선 제안**:

  ```typescript
  // SearchProvider 패턴 도입
  const SearchProvider = ({ children }: { children: React.ReactNode }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const searchInstance = useMemo(() => new BlogSearch(posts), [posts]);

    return <SearchContext.Provider value={{ posts, searchInstance }}>{children}</SearchContext.Provider>;
  };
  ```

### 1.4 에러 처리 (Error Handling) ❌

- **문제점**:

  - API 호출 에러 처리가 일관성 없음
  - 사용자에게 에러 피드백 부족

- **개선 제안**:

  ```typescript
  // Error Boundary 구현
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error("Error caught by boundary:", error, errorInfo);
      // 에러 로깅 서비스에 전송 (Sentry, LogRocket 등)
    }

    render() {
      if (this.state.hasError) {
        return <ErrorFallback />;
      }

      return this.props.children;
    }
  }
  ```

## 2. 성능 최적화

### 2.1 렌더링 최적화 ⚠️

- **문제점**:

  - Header 플러그인이 매번 재생성됨
  - 이미지 최적화가 완벽하지 않음

- **개선 제안**:

  ```typescript
  // 플러그인 메모이제이션
  const headerPlugins = useMemo(
    () => [createLogoPlugin(), createNavigationPlugin(), createSearchPlugin(posts), createThemeTogglePlugin()],
    [posts]
  );

  // 이미지 지연 로딩
  const LazyImage = ({ src, alt, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={imgRef} {...props}>
        {isInView && (
          <Image
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    );
  };
  ```

### 2.2 데이터 페칭 최적화 ⚠️

- **개선 제안**:

  ```typescript
  // SWR 또는 React Query로 데이터 캐싱
  const usePosts = () => {
    return useQuery({
      queryKey: ["posts"],
      queryFn: getAllPosts,
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    });
  };

  // Prefetching 구현
  const prefetchPost = (postId: string) => {
    queryClient.prefetchQuery(["post", postId], () => getPostById(postId));
  };
  ```

## 3. 추가 기능 제안

### 3.1 북마크/즐겨찾기 기능

```typescript
// localStorage 기반 북마크
const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => JSON.parse(localStorage.getItem("bookmarks") || "[]"));

  const toggleBookmark = (postId: string) => {
    setBookmarks((prev) => {
      const newBookmarks = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];

      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  return { bookmarks, toggleBookmark, isBookmarked: (id: string) => bookmarks.includes(id) };
};
```

### 3.2 다크 모드 테마 시스템 확장

```typescript
// 다중 테마 지원
const themes = {
  light: {
    background: "#ffffff",
    text: "#000000",
    primary: "#75a788",
  },
  dark: {
    background: "#070b14",
    text: "#ffffff",
    primary: "#5a8a6d",
  },
  sepia: {
    background: "#f4ecd8",
    text: "#5c4b24",
    primary: "#8b7355",
  },
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      <div className={`theme-${theme}`}>{children}</div>
    </ThemeContext.Provider>
  );
};
```

### 3.3 코드 블록 개선

```typescript
// 코드 블록 컴포넌트 확장
const CodeBlock = ({ code, language, filename }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      {filename && <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm">{filename}</div>}
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
        <button onClick={copyCode} className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded">
          {isCopied ? "✓" : "📋"}
        </button>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};
```

### 3.4 무한 스크롤

```typescript
// Intersection Observer 기반 무한 스크롤
const useInfiniteScroll = (fetchMore) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true);
          await fetchMore();
          setIsLoading(false);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchMore, isLoading]);

  return { observerRef, isLoading };
};
```

### 3.5 댓글 시스템 개선

```typescript
// 댓글 답글 기능
const Comment = ({ comment, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="ml-4 border-l-2 border-gray-200 pl-4">
      <p>{comment.content}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => setIsReplying(!isReplying)}>답글</button>
      </div>

      {isReplying && (
        <CommentForm
          onSubmit={(content) => {
            onReply(comment.id, content);
            setIsReplying(false);
          }}
          placeholder={`${comment.author}에게 답글 달기...`}
        />
      )}

      {comment.replies?.map((reply) => (
        <Comment key={reply.id} comment={reply} onReply={onReply} />
      ))}
    </div>
  );
};
```

### 3.6 RSS 피드 확장

```typescript
// 카테고리별 RSS 피드
app / rss / [category] / route.ts;
export async function GET(request: Request, { params }: { params: { category: string } }) {
  const posts = await getPostsByCategory(params.category);

  const rss = generateRSS({
    title: `박창준 블로그 - ${params.category}`,
    posts,
  });

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
```

### 3.7 검색 기능 확장

```typescript
// 검색 필터 및 정렬
const useAdvancedSearch = () => {
  const [filters, setFilters] = useState({
    query: "",
    tags: [],
    dateRange: null,
    sortBy: "relevance", // 'relevance' | 'date' | 'views'
  });

  const searchResults = useMemo(() => {
    let results = searchInstance.search(filters.query);

    // 태그 필터
    if (filters.tags.length > 0) {
      results = results.filter((post) => post.tags.some((tag) => filters.tags.includes(tag.name)));
    }

    // 날짜 필터
    if (filters.dateRange) {
      results = results.filter((post) => isWithinDateRange(post.publishedAt, filters.dateRange));
    }

    // 정렬
    switch (filters.sortBy) {
      case "date":
        results.sort((a, b) => b.post.publishedAt - a.post.publishedAt);
        break;
      case "views":
        results.sort((a, b) => b.post.views - a.post.views);
        break;
    }

    return results;
  }, [filters]);

  return { filters, setFilters, searchResults };
};
```

### 3.8 애널리틱스 통합

```typescript
// 페이지 뷰 추적
const usePageView = (path: string) => {
  useEffect(() => {
    // Google Analytics 4
    gtag("config", "GA_MEASUREMENT_ID", {
      page_path: path,
    });

    // Plausible
    plausible("pageview", { u: path });
  }, [path]);
};

// 이벤트 추적
const useAnalytics = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    gtag("event", eventName, properties);
    plausible(eventName, { props: properties });
  };

  return { trackEvent };
};
```

## 4. 접근성 개선

### 4.1 키보드 내비게이션

- 모달, 드롭다운에 트랩 포커스 구현
- 스킵 링크 추가
- 포커스 visible 상태 개선

### 4.2 색상 대비율

- WCAG 2.1 AA 기준 준수 확인
- 고대비 모드 지원

### 4.3 스크린 리더

- 적절한 aria-label 추가
- 시맨틱 HTML 사용
- 라이브 리전 announcements

## 5. SEO 최적화

### 5.1 구조화된 데이터 확장

```typescript
// Article schema 확장
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  image: post.coverImage,
  author: {
    "@type": "Person",
    name: "박창준",
  },
  publisher: {
    "@type": "Organization",
    name: "박창준 블로그",
    logo: {
      "@type": "ImageObject",
      url: "https://changjun.dev/logo.png",
    },
  },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  wordCount: post.content.length,
  articleSection: post.tags.map((tag) => tag.name),
};
```

### 5.2 메타 태그 최적화

- 동적 메타 디스크립션 생성
- OG 이미지 자동 생성
- Twitter Card 최적화

## 6. 보안 강화

### 6.1 CSP (Content Security Policy)

- HTTP 헤더에 CSP 추가
- 인라인 스크립트 최소화

### 6.2 Rate Limiting

- API 엔드포인트에 Rate Limiting 적용
- 검색 API 제한

## 7. 배포 및 운영

### 7.1 CI/CD

- GitHub Actions로 자동 배포
- E2E 테스트 추가

### 7.2 모니터링

- 성능 모니터링 (Lighthouse CI)
- 에러 추적 (Sentry)
- 사용자 행동 추적 (Hotjar)

## 우선순위 제안

1. **즉시**: 에러 처리, 성능 최적화, 접근성 개선
2. **단기**: 북마크, 다크모드 확장, 코드 블록 개선
3. **중기**: 무한 스크롤, 고급 검색, 댓글 개선
4. **장기**: 애널리틱스, 보안 강화, CI/CD 구축
