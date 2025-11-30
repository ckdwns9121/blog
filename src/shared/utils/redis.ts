import { createClient } from "redis";

let clientPromise: Promise<ReturnType<typeof createClient>> | null = null;

/**
 * Redis 클라이언트 초기화 및 반환
 * Vercel Redis 통합 시 환경 변수가 자동으로 주입됩니다.
 *
 * Promise를 캐싱하여 동시 요청 시 레이스 컨디션을 방지합니다.
 * 여러 요청이 동시에 들어와도 같은 Promise를 기다리므로 단일 클라이언트만 생성됩니다.
 */
export function getRedisClient(): Promise<ReturnType<typeof createClient>> {
  // 이미 연결 중이거나 연결된 클라이언트 Promise가 있으면 반환
  if (clientPromise) {
    return clientPromise;
  }

  // 연결 과정을 Promise로 감싸서 캐싱
  clientPromise = (async () => {
    // Vercel Redis 통합 시 자동으로 주입되는 환경 변수
    // Custom Prefix를 사용한 경우를 지원 (예: STORAGE_REDIS_URL)
    // 우선순위: 1. Custom Prefix 변수, 2. 기본 변수
    const redisUrl = process.env.STORAGE_REDIS_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL;

    if (!redisUrl) {
      throw new Error(
        "Redis 환경 변수가 설정되지 않았습니다. Vercel 프로젝트에 Redis 통합을 추가해주세요.\n" +
          "확인할 환경 변수: REDIS_URL, KV_REST_API_URL 또는 STORAGE_REDIS_URL"
      );
    }

    const client = createClient({ url: redisUrl });

    // 에러 핸들링
    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
      // 연결 실패 시 재시도 가능하도록 Promise 초기화
      clientPromise = null;
    });

    await client.connect();

    return client;
  })();

  return clientPromise;
}

/**
 * 포스트 조회수 키 생성
 */
export function getPostViewsKey(slug: string): string {
  return `post:views:${slug}`;
}

/**
 * 포스트 조회 기록 키 생성 (중복 방지용)
 */
export function getPostViewedKey(slug: string, identifier: string): string {
  return `post:viewed:${slug}:${identifier}`;
}

/**
 * 클라이언트 식별자 생성 (IP 기반)
 */
export function getClientIdentifier(request: Request): string {
  // Vercel에서 제공하는 헤더 사용
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  // IP 주소 추출
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return ip;
}
