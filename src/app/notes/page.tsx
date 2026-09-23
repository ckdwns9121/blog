import type { Metadata } from "next";
import { NoteList } from "@/entities/note/ui/NoteList";
import { getAllNotes } from "@/entities/note/api";
import { BASE_URL } from "@/shared/constants";
import "@/app/init-post-api";

// 글 페이지와 같은 정책. 갱신은 /api/revalidate 가 트리거한다.
export const dynamic = "force-static";
export const revalidate = false;

const DESCRIPTION = "다듬지 않은 짧은 생각들. 버리기엔 아까운 것들을 여기에 끄적여요.";

export const metadata: Metadata = {
  title: "노트 | 박창준 블로그",
  description: DESCRIPTION,
  alternates: { canonical: "/notes" },
  openGraph: {
    title: "노트 | 박창준 블로그",
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    url: `${BASE_URL}/notes`,
  },
};

export default async function NotesPage() {
  const notes = await getAllNotes();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="pt-3 pb-8 sm:pt-4 sm:pb-10">
        <h1 className="text-fg text-2xl font-bold tracking-tight">노트</h1>
        <p className="text-fg-muted mt-2 text-sm leading-relaxed">{DESCRIPTION}</p>
      </header>

      <NoteList notes={notes} />
    </div>
  );
}
