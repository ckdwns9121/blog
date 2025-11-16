import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function SearchInput({ query, onQueryChange, onClose, inputRef }: SearchInputProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-dark-border">
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="포스트 검색... (제목, 내용, 태그)"
        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
        autoFocus
      />
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="닫기"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

