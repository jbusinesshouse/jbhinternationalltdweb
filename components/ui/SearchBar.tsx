"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";

type StoreTypeOption = "all" | "wholesale" | "retail";

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  /** "lg" = header search with the store-type picker; "md" = plain. */
  size?: "md" | "lg";
};

const STORE_TYPES: { value: StoreTypeOption; label: string }[] = [
  { value: "all", label: "সব পণ্য" },
  { value: "wholesale", label: "পাইকারি" },
  { value: "retail", label: "খুচরা" },
];

export function SearchBar({
  defaultValue = "",
  placeholder = "কী খুঁজছেন? যেমন: জার্সি, পোলো শার্ট, জিন্স",
  className = "",
  size = "md",
}: SearchBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(defaultValue || params.get("q") || "");
  const initialType = params.get("storeType");
  const [storeType, setStoreType] = useState<StoreTypeOption>(
    initialType === "wholesale" || initialType === "retail" ? initialType : "all"
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = new URLSearchParams({ q: trimmed });
    if (storeType !== "all") next.set("storeType", storeType);
    router.push(`/search?${next.toString()}`);
  };

  const large = size === "lg";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`flex min-w-0 overflow-hidden rounded-2xl border-2 border-primary bg-white ${
        large ? "h-[50px]" : "h-12"
      } ${className}`}
    >
      {large && (
        <label className="relative hidden shrink-0 items-center border-r border-border sm:flex">
          <span className="sr-only">পণ্যের ধরন</span>
          <select
            value={storeType}
            onChange={(e) => setStoreType(e.target.value as StoreTypeOption)}
            className="h-full appearance-none bg-transparent pl-4 pr-9 text-sm font-semibold text-foreground focus:outline-none"
          >
            {STORE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={16} className="pointer-events-none absolute right-3 text-muted" />
        </label>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="পণ্য খুঁজুন"
        className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-foreground placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-2 bg-primary px-4 font-bold text-primary-ink transition-colors hover:bg-primary-dark sm:px-6"
        aria-label="খুঁজুন"
      >
        <SearchIcon size={20} />
        <span className="hidden sm:inline">খুঁজুন</span>
      </button>
    </form>
  );
}
