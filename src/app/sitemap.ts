import { MetadataRoute } from "next";
import { getAllPosts } from "@/entities/post/api";
import { BASE_URL } from "@/shared/constants";
import "@/app/init-post-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 모든 포스트 가져오기
  const posts = await getAllPosts();

  // 포스트 URL 생성
  const postUrls = posts.map((post) => ({
    url: `${BASE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 정적 페이지들
  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return [...routes, ...postUrls];
}
