"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
  hasActiveChannelFilters,
  useChannelFilters,
} from "../../search-params";

export function ChannelFilters() {
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useChannelFilters({ startTransition });
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const lastPushedRef = useRef(filters.search);

  useEffect(() => {
    if (filters.search === lastPushedRef.current) {
      return;
    }

    lastPushedRef.current = filters.search;
    setSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (search !== debouncedSearch || debouncedSearch === filters.search) {
      return;
    }

    lastPushedRef.current = debouncedSearch;
    setFilters({ search: debouncedSearch, page: 1 });
  }, [search, debouncedSearch, filters.search, setFilters]);

  const isFiltered = hasActiveChannelFilters(filters);
  const isSorted =
    filters.sortBy !== "createdAt" || filters.sortOrder !== "desc";

  function reset() {
    setSearch("");
    setFilters({ search: null, sortBy: null, sortOrder: null, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex w-full items-center gap-2 sm:max-w-xs">
        <Input
          aria-label="Search channels"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search channels by name..."
          value={search}
        />
        {(isFiltered || isSorted) && (
          <Button onClick={reset} variant="outline">
            <X className="size-4" />
            <span className="hidden sm:flex">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
