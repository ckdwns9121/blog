const POSTS_PER_PAGE = 20 as const;
const normalizeBaseUrl = (url: string) => {
  const baseUrl = url.replace(/\/+$/, "");
  return baseUrl === "https://changjun.dev" ? "https://www.changjun.dev" : baseUrl;
};

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://www.changjun.dev");

export { BASE_URL, POSTS_PER_PAGE };
