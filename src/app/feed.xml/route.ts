import { Feed } from "feed";
import { getAllPosts } from "@/entities/post/api";
import { BASE_URL } from "@/shared/constants";
import { getOptimizedImageData } from "@/shared/utils/imageMapper";
import { toAbsoluteUrl } from "@/shared/lib/postImage";
import "@/app/init-post-api";
// 피드는 방문자 요청마다 Notion을 부르지 않도록 정적으로 생성한다.
// 갱신은 /api/revalidate 가 이 경로를 무효화할 때 일어난다.
export const dynamic = "force-static";


export async function GET() {
  const feed = new Feed({
    title: "프론트엔드 개발자 박창준",
    description:
      "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
    id: BASE_URL,
    link: BASE_URL,
    language: "ko",
    image: `${BASE_URL}/logo.png`,
    favicon: `${BASE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, 박창준`,
    updated: new Date(),
    generator: "Feed for Node.js",
    feedLinks: {
      rss2: `${BASE_URL}/feed.xml`,
      json: `${BASE_URL}/feed.json`,
      atom: `${BASE_URL}/atom.xml`,
    },
    author: {
      name: "박창준",
      email: "changjun@example.com",
      link: BASE_URL,
    },
  });

  // 모든 포스트 가져오기
  const posts = await getAllPosts();

  // 발행일 기준으로 정렬
  const sortedPosts = posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // 각 포스트를 피드에 추가
  sortedPosts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${BASE_URL}/posts/${post.slug}`,
      link: `${BASE_URL}/posts/${post.slug}`,
      description: post.excerpt || post.title,
      content: post.excerpt || post.title,
      author: [
        {
          name: "박창준",
          email: "changjun@example.com",
          link: BASE_URL,
        },
      ],
      date: new Date(post.publishedAt),
      category: post.tags.map((tag) => ({
        name: tag.name,
        term: tag.name,
      })),
      // Notion 프록시 주소 대신 빌드 때 내려받은 로컬 이미지를 절대 URL로 넣는다.
      ...(post.coverImage ? { image: toAbsoluteUrl(getOptimizedImageData(post.coverImage).src, BASE_URL) } : {}),
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
