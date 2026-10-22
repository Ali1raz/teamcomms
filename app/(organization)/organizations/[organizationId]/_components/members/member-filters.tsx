"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MembershipRole } from "@/generated/prisma/enums";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { toMembershipRole } from "../../invitations/constants";
import {
  hasActiveOrganizationMemberFilters,
  useOrganizationMemberFilters,
} from "../../search-params";

const ALL = "all";

export function MemberFilters() {
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useOrganizationMemberFilters({
    startTransition,
  });
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

  const isFiltered = hasActiveOrganizationMemberFilters(filters);
  const isSorted = filters.sortBy !== "name" || filters.sortOrder !== "desc";

  function reset() {
    setSearch("");
    setFilters({
      search: null,
      role: null,
      sortBy: null,
      sortOrder: null,
      page: 1,
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex w-full items-center gap-2 sm:max-w-xs">
        <Input
          aria-label="Search members"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email..."
          value={search}
        />
        {(isFiltered || isSorted) && (
          <Button onClick={reset} variant="outline">
            <X className="size-4" />
            <span className="hidden sm:flex">Reset</span>
          </Button>
        )}
      </div>

      <Select
        onValueChange={(value) =>
          setFilters({
            role: value === ALL ? null : toMembershipRole(value),
            page: 1,
          })
        }
        value={filters.role ?? ALL}
      >
        <SelectTrigger aria-label="Filter by role" className="w-36">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Member role</SelectLabel>
            <SelectItem value={ALL}>All roles</SelectItem>
            {Object.values(MembershipRole).map((role) => (
              <SelectItem className="capitalize" key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
