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
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 rounded-lg border border-border bg-white px-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${sizeClasses}`}
      />
      <button
        type="submit"
        className={`rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-dark ${sizeClasses}`}
      >
        Search
      </button>
    </form>
  );
}
