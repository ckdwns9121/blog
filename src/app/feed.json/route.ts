import { Feed } from "feed";
import { getAllPosts } from "@/entities/post/api";
import "@/app/init-post-api";
// 피드는 방문자 요청마다 Notion을 부르지 않도록 정적으로 생성한다.
// 갱신은 /api/revalidate 가 이 경로를 무효화할 때 일어난다.
export const dynamic = "force-static";


export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changjun.dev";

  const feed = new Feed({
    title: "프론트엔드 개발자 박창준",
    description:
      "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
    id: baseUrl,
    link: baseUrl,
    language: "ko",
    image: `${baseUrl}/og-image.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, 박창준`,
    updated: new Date(),
    generator: "Feed for Node.js",
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
      json: `${baseUrl}/feed.json`,
      atom: `${baseUrl}/atom.xml`,
    },
    author: {
      name: "박창준",
      email: "changjun@example.com",
      link: baseUrl,
    },
  });

  const posts = await getAllPosts();
  const sortedPosts = posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  sortedPosts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${baseUrl}/posts/${post.slug}`,
      link: `${baseUrl}/posts/${post.slug}`,
      description: post.excerpt || post.title,
      content: post.excerpt || post.title,
      author: [
        {
          name: "박창준",
          email: "changjun@example.com",
          link: baseUrl,
        },
      ],
      date: new Date(post.publishedAt),
      category: post.tags.map((tag) => ({
        name: tag.name,
        term: tag.name,
      })),
      image: post.coverImage,
    });
  });

  return new Response(feed.json1(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
