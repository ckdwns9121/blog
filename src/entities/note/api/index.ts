import type { Note, NoteSummary } from "../model";
import { getAllPosts, getPostByPageId } from "@/features/notion";

/**
 * 노트 조회 API.
 *
 * 글과 같은 Notion 데이터베이스를 읽되 `type`이 note인 것만 추린다.
 * 목록 조회는 글 쪽과 같은 함수를 쓰므로 Notion 호출이 늘지 않는다.
 * (해당 함수가 프로세스 단위로 결과를 공유한다)
 */

/**
 * 제목에서 주소를 만든다.
 *
 * 한글을 살리려고 Unicode 문자와 숫자만 남기고 공백을 하이픈으로 바꾼다.
 * 쓰는 사람이 주소를 따로 정할 필요가 없어야 하므로 제목 하나에서 파생시킨다.
 */
export function noteSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export async function getAllNotes(): Promise<NoteSummary[]> {
  const posts = await getAllPosts();

  return posts
    .filter((post) => post.contentType === "note")
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: noteSlug(post.title),
      excerpt: post.excerpt ?? "",
      writtenAt: new Date(post.publishedAt),
    }))
    .sort((a, b) => b.writtenAt.getTime() - a.writtenAt.getTime());
}

/**
 * 주소로 노트 본문까지 가져온다. 없으면 null이고 호출하는 쪽에서 404로 바꾼다.
 *
 * 주소에 페이지 ID가 없으므로 목록에서 제목을 맞춰 ID를 찾은 뒤 본문을 받는다.
 * 제목이 같은 노트가 둘이면 최신 것이 잡힌다.
 */
export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const decoded = decodeURIComponent(slug);
  const notes = await getAllNotes();
  const summary = notes.find((note) => note.slug === decoded);
  if (!summary) return null;

  const post = await getPostByPageId(summary.id, true);

  return {
    ...summary,
    // 본문이 비어 있을 때를 대비해 목록 쪽 값을 우선한다
    title: summary.title || post.title,
    excerpt: summary.excerpt || post.excerpt,
    content: post.content,
  };
}
