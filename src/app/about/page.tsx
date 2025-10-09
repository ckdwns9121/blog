export default function About() {
  return (
    <div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-8 border border-gray-200 dark:border-dark-border">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About</h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-4">안녕하세요 프론트엔드 엔지니어 박창준입니다.</p>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              기술 블로그를 운영하며 개발 경험과 기술 트렌드를 공유하고 있습니다.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">주요 관심사</h2>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              <li>• 웹 개발 (React, Next.js, TypeScript)</li>
              <li>• 프론트엔드 아키텍처</li>
              <li>• 사용자 경험 (UX) 디자인</li>
              <li>• 개발 도구와 워크플로우</li>
              <li>• 기술 트렌드와 학습</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">연락처</h2>
            <p className="text-gray-600 dark:text-gray-300">궁금한 점이나 피드백이 있으시면 언제든지 연락해 주세요.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
