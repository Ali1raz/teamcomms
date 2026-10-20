"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  DEFAULT_TEAM_SORT_FIELD,
  DEFAULT_TEAM_SORT_ORDER,
} from "../../constants";
import { hasActiveTeamFilters, useTeamFilters } from "../../search-params";

export function TeamFilters() {
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useTeamFilters({ startTransition });
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

  const isFiltered = hasActiveTeamFilters(filters);
  const isSorted =
    filters.sortBy !== DEFAULT_TEAM_SORT_FIELD ||
    filters.sortOrder !== DEFAULT_TEAM_SORT_ORDER;

  function reset() {
    setSearch("");
    setFilters({ search: null, sortBy: null, sortOrder: null, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex w-full items-center gap-2 sm:max-w-xs">
        <Input
          aria-label="Search teams"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search teams by name..."
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
