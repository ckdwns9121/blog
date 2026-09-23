import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostContent from "@/entities/post/ui/PostContent";
import { getAllNotes, getNoteBySlug } from "@/entities/note/api";
import { isNotionNotFoundError } from "@/features/notion";
import { BASE_URL } from "@/shared/constants";
import "@/app/init-post-api";

export const dynamic = "force-static";
export const revalidate = false;

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export async function generateStaticParams() {
  const notes = await getAllNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const note = await getNoteBySlug(slug);
    if (!note) return { title: "노트를 찾을 수 없습니다" };

    const path = `/notes/${note.slug}`;
    return {
      title: `${note.title} | 노트`,
      description: note.excerpt || note.title,
      alternates: { canonical: path },
      openGraph: {
        title: note.title,
        description: note.excerpt || note.title,
        type: "article",
        locale: "ko_KR",
        url: `${BASE_URL}${path}`,
        publishedTime: note.writtenAt.toISOString(),
      },
    };
  } catch {
    return { title: "노트 | 박창준 블로그" };
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;

  let note;
  try {
    note = await getNoteBySlug(slug);
  } catch (error) {
    // 글 페이지와 같은 규칙. Notion이 "없다"고 답한 경우만 404로 바꾸고
    // 속도 제한 같은 일시적 실패는 던져서 기존 페이지가 유지되게 한다.
    if (isNotionNotFoundError(error)) notFound();
    console.error(`Error fetching note "${slug}":`, error);
    throw error;
  }

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="pt-3 pb-8 sm:pt-4">
        <Link href="/notes" className="text-fg-muted hover:text-fg text-sm transition-colors">
          ← 노트
        </Link>
      </nav>

      <article>
        <h1 className="text-fg text-2xl leading-snug font-bold tracking-tight sm:text-3xl">{note.title}</h1>
        <time dateTime={note.writtenAt.toISOString()} className="text-fg-subtle mt-4 block text-xs tabular-nums">
          {formatDate(note.writtenAt)}
        </time>
        <div className="border-line mt-8 border-t pt-8">
          <PostContent blocks={note.content} />
        </div>
      </article>
    </div>
  );
}
