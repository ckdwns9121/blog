import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface PostSummaryProps {
  summary?: string;
}

export function PostSummary({ summary }: PostSummaryProps) {
  if (!summary?.trim()) return null;

  return (
    <section
      aria-label="글 요약"
      className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/60"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary-700 dark:text-primary-300">
        <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
        <span>요약</span>
      </div>
      <p className="text-base leading-7 text-gray-700 dark:text-gray-300">{summary}</p>
    </section>
  );
}
