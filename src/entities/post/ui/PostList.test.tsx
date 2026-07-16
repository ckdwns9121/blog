import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PostMetadata } from "../model/usePostsQuery";
import { PostList } from "./PostList";

jest.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({
    href,
    onClick,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault();
          onClick?.(event);
        }}
        {...props}
      >
        {children}
      </a>
    );
  },
}));

const posts: PostMetadata[] = Array.from({ length: 45 }, (_, index) => ({
  id: `post-${index + 1}`,
  title: `Post ${index + 1}`,
  slug: `post-${index + 1}`,
  excerpt: `Excerpt ${index + 1}`,
  publishedAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  tags: [],
}));

let triggerIntersection: (() => void) | undefined;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    triggerIntersection = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

describe("PostList history restoration", () => {
  beforeEach(() => {
    triggerIntersection = undefined;
    window.history.replaceState({}, "", "/");
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: MockIntersectionObserver,
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: jest.fn(),
    });
  });

  it("stores the loaded count and scroll position before opening a post", () => {
    window.history.replaceState({ __NA: true }, "", "/");
    render(<PostList posts={posts} postsPerPage={20} />);

    act(() => triggerIntersection?.());
    expect(screen.getAllByRole("article")).toHaveLength(40);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
    fireEvent.click(screen.getByRole("link", { name: "Post 40" }));

    expect(window.history.state.postList).toEqual({
      selectedTag: null,
      scrollY: 1600,
      visibleCount: 40,
    });
    expect(window.history.state.__NA).toBe(true);
  });

  it("rebuilds the list before restoring scroll on a matching history entry", async () => {
    window.history.replaceState(
      {
        postList: {
          selectedTag: null,
          scrollY: 1600,
          visibleCount: 40,
        },
      },
      "",
      "/",
    );

    render(<PostList posts={posts} postsPerPage={20} />);

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(40));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 1600);
  });

  it("ignores history state saved for a different tag", () => {
    window.history.replaceState(
      {
        postList: {
          selectedTag: "React",
          scrollY: 1600,
          visibleCount: 40,
        },
      },
      "",
      "/",
    );

    render(<PostList posts={posts} postsPerPage={20} />);

    expect(screen.getAllByRole("article")).toHaveLength(20);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
