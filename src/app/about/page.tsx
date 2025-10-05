import { Header } from "../../shared/Header";

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About</h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              안녕하세요! 개발과 기술에 관한 다양한 이야기들을 공유하는 블로그입니다.
            </p>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              이 블로그에서는 웹 개발, 프로그래밍, 기술 트렌드, 그리고 개발자로서의 경험과 생각들을 정리하고 공유하고
              있습니다.
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
