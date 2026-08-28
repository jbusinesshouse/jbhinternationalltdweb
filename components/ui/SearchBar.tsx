"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
};

export function SearchBar({
  defaultValue = "",
  placeholder = "Search products...",
  className = "",
  size = "md",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const sizeClasses = size === "sm" ? "py-2 text-sm" : "py-3 text-base";

  return (
    <form onSubmit={handleSubmit} className={`flex min-w-0 gap-2 ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4 ${sizeClasses}`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-lg bg-primary font-semibold text-white transition-colors hover:bg-primary-dark ${sizeClasses} ${size === "sm" ? "px-3 sm:px-5" : "px-5"}`}
        aria-label="Search"
      >
        <span className="hidden sm:inline">Search</span>
        <svg
          className="h-5 w-5 sm:hidden"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
}
