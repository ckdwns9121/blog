"use client";

import Link from "next/link";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} <span className="font-semibold">changjun</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
