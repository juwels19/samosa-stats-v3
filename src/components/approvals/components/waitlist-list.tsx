"use client";

import {
  Button,
  SearchField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import WaitlistEntryRow from "@/components/approvals/components/waitlist-entry-row";
import type { WaitlistEntryAction } from "@/components/approvals/types";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

const PAGE_SIZE = 10;

type SortKey = "newest" | "oldest" | "email";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "email", label: "Email" },
];

function compareEntries(sort: SortKey) {
  return (a: SerializedWaitlistEntry, b: SerializedWaitlistEntry) => {
    if (sort === "email") return a.emailAddress.localeCompare(b.emailAddress);
    if (sort === "oldest") return a.createdAt - b.createdAt;
    return b.createdAt - a.createdAt;
  };
}

export default function WaitlistList({
  entries,
  inviteAction,
  revokeAction,
}: {
  entries: SerializedWaitlistEntry[];
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
      ? entries.filter((entry) =>
          entry.emailAddress.toLowerCase().includes(normalizedQuery),
        )
      : entries;
    return [...matches].sort(compareEntries(sort));
  }, [entries, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageEntries = filteredEntries.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const firstShown = filteredEntries.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const lastShown = currentPage * PAGE_SIZE + pageEntries.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          aria-label="Filter by email"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(0);
          }}
          className="w-full sm:max-w-sm"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              placeholder="Filter by email"
              type="search"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <ToggleButtonGroup
          aria-label="Sort entries"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[sort]}
          onSelectionChange={(keys) => {
            const [next] = keys;
            if (next) {
              setSort(next as SortKey);
              setPage(0);
            }
          }}
          className="w-full sm:w-auto"
          fullWidth
        >
          {SORT_OPTIONS.map((option, index) => (
            <ToggleButton key={option.id} id={option.id} className="min-h-11 sm:min-h-9">
              {index > 0 ? <ToggleButtonGroup.Separator /> : null}
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {pageEntries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          No waitlist entries match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:px-3">
          <div
            aria-hidden
            className="hidden grid-cols-[minmax(0,1fr)_7rem_10rem_9rem] gap-4 border-b border-border px-2 py-2.5 text-xs font-medium text-muted lg:grid"
          >
            <span>Email</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-0">
            {pageEntries.map((entry) => (
              <WaitlistEntryRow
                key={entry.id}
                entry={entry}
                inviteAction={inviteAction}
                revokeAction={revokeAction}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted tabular-nums" aria-live="polite">
          {firstShown} to {lastShown} of {filteredEntries.length}
        </p>
        <div className="flex gap-2">
          <Button
            isIconOnly
            variant="secondary"
            className="size-11 sm:size-9"
            aria-label="Previous page"
            isDisabled={currentPage === 0}
            onPress={() => setPage(currentPage - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            isIconOnly
            variant="secondary"
            className="size-11 sm:size-9"
            aria-label="Next page"
            isDisabled={currentPage >= pageCount - 1}
            onPress={() => setPage(currentPage + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
