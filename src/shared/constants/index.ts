const POSTS_PER_PAGE = 20 as const;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://changjun.dev";

export { BASE_URL, POSTS_PER_PAGE };
