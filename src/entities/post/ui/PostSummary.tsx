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
      <p className="text-base leading-7 text-gray-700 dark:text-gray-300">{summary}</p>
    </section>
  );
}
