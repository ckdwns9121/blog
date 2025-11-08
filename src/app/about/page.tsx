import Image from "next/image";
import Link from "next/link";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

export default function About() {
  return (
    <div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-white min-h-screen">
      <main className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-16">
        {/* 프로필 헤더 */}
        <div className="flex flex-col md:flex-row gap-8 mb-16 items-center md:items-start">
          {/* 왼쪽: 프로필 이미지 */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative w-40 h-40 md:w-48 md:h-48 overflow-hidden">
              <Image
                src="/profile.jpeg"
                alt="박창준 프로필"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* 오른쪽: 정보 */}
          <div className="flex-1 w-full md:w-auto">
            <h1 className="text-3xl font-medium text-gray-900 dark:text-white mb-2 text-left">박창준</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-left">프론트엔드 엔지니어</p>
            <div className="flex gap-4 mb-8 justify-start">
              <Link
                href="https://github.com/ckdwns9121"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="GitHub 프로필"
              >
                <CodeBracketIcon className="h-5 w-5" />
                <span className="text-sm font-medium">GitHub</span>
              </Link>
              <Link
                href="https://linkedin.com/in/devchangjun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="LinkedIn 프로필"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </Link>
            </div>

            {/* 소개 */}
            <div className="text-left">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                안녕하세요. 프론트엔드 엔지니어 박창준입니다.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                복잡한 문제를 구조화하고, 빠르게 실행하는 것을 강점으로 가지고 있습니다. 
                이러한 강점을 바탕으로 스타트업을 공동창업하여 제품을 0부터 1까지 만들어왔던 경험이 있습니다. 
                React와 Next.js를 활용한 웹 애플리케이션 개발에 집중하고 있으며, 
                기술 블로그를 통해 개발 경험과 학습한 내용을 공유하고 있습니다.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                개발을 단순히 코드를 작성하는 것이 아니라 문제를 해결하는 과정으로 봅니다. 
                따라서 프론트엔드에 국한되지 않고, 주어진 문제에 가장 적합한 기술과 방법을 선택하여 
                해결책을 만들어냅니다. 기술 블로그를 통해 이러한 문제해결 과정과 경험을 공유하고 있습니다.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                팀 협업과 조직문화에도 관심이 많습니다. 효과적인 협업을 통해 더 나은 결과를 만들어내고, 
                건강한 조직문화가 개발자의 성장과 제품의 품질에 미치는 긍정적인 영향을 경험했습니다. 
                이러한 경험을 바탕으로 팀의 생산성과 만족도를 높이는 방법에 대해 지속적으로 학습하고 실천하고 있습니다.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                현재는{" "}
                <Link
                  href="https://colosseum.global/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline underline-offset-2 transition-colors"
                >
                  Colosseum
                </Link>
                에서 WMS, OMS 서비스를 개발하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
