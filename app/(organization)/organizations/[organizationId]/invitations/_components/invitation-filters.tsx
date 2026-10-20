"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import {
  INVITATION_STATUSES,
  toInvitationStatus,
  toMembershipRole,
} from "../constants";
import {
  hasActiveInvitationFilters,
  useInvitationFilters,
} from "../search-params";

const ALL = "all";

export function InvitationFilters() {
  const [filters, setFilters] = useInvitationFilters();
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  // Track the value we last sent to the URL so external changes (back/forward)
  // can be told apart from our own debounced updates.
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

  const isFiltered = hasActiveInvitationFilters(filters);

  function reset() {
    setSearch("");
    setFilters({ search: null, status: null, role: null, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-2 sm:max-w-xs w-full">
        <Input
          aria-label="Search invitations"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email or inviter..."
          value={search}
        />
        {isFiltered && (
          <Button onClick={reset} variant="outline">
            <X className="size-4" />
            <span className="hidden sm:flex">Reset</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          onValueChange={(value) =>
            setFilters({
              status: value === ALL ? null : toInvitationStatus(value),
              page: 1,
            })
          }
          value={filters.status ?? ALL}
        >
          <SelectTrigger aria-label="Filter by status" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Invitation status</SelectLabel>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {INVITATION_STATUSES.map((status) => (
                <SelectItem className="capitalize" key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) =>
            setFilters({
              role: value === ALL ? null : toMembershipRole(value),
              page: 1,
            })
          }
          value={filters.role ?? ALL}
        >
          <SelectTrigger aria-label="Filter by role" className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {Object.values(MembershipRole).map((role) => (
              <SelectItem className="capitalize" key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
