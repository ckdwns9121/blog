import Link from "next/link";
import type { NoteSummary } from "../model";

interface NoteListProps {
  notes: NoteSummary[];
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

/**
 * 노트 목록.
 *
 * 글 목록과 같은 구조지만 썸네일과 태그가 없다.
 * 제목과 요약, 날짜만 두어 기술 글 목록과 분위기를 구분한다.
 */
export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="text-fg-muted py-12 text-center">아직 노트가 없습니다.</p>;
  }

  return (
    <ol className="border-line border-t">
      {notes.map((note) => (
        <li key={note.id} className="border-line border-b">
          <article>
            <Link href={`/notes/${note.slug}`} className="group block py-7 sm:py-9">
              <h2 className="text-fg group-hover:text-primary-600 dark:group-hover:text-primary-400 text-lg leading-snug font-bold tracking-tight transition-colors sm:text-xl">
                {note.title}
              </h2>
              {note.excerpt && (
                <p className="text-fg-muted mt-2.5 line-clamp-2 text-sm leading-relaxed sm:text-[15px]">
                  {note.excerpt}
                </p>
              )}
              <time
                dateTime={note.writtenAt.toISOString()}
                className="text-fg-subtle mt-4 block text-xs tabular-nums"
              >
                {formatDate(note.writtenAt)}
              </time>
            </Link>
          </article>
        </li>
      ))}
    </ol>
  );
}
