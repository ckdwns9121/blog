"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/shared/lib/cn";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchInput({ placeholder = "검색어를 입력하세요...", className, onSearch }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const queryParam = searchParams?.get("q");
    if (queryParam) {
      setQuery(queryParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(query);
    } else {
      const params = new URLSearchParams(searchParams?.toString());
      if (query.trim()) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`/search?${params.toString()}`);
    }

    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md",
              "leading-5 bg-white placeholder-gray-500 focus:outline-none",
              "focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500",
              "focus:border-blue-500 text-sm",
              isOpen && "ring-1 ring-blue-500 border-blue-500"
            )}
          />
        </div>
      </form>
    </div>
  );
}
