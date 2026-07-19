"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Plus, Check, X } from "lucide-react";
import { Chip, Input, Button, Spinner, EmptyState } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { ExerciseRow } from "@/components/exercises/ExerciseRow";
import { CreateExerciseSheet } from "@/components/exercises/CreateExerciseSheet";
import { titleCase } from "@/lib/utils";
import type { ExerciseListItem, FacetValue } from "@/server/exercises";

export type Facets = {
  bodyParts: FacetValue[];
  equipment: FacetValue[];
  targets: FacetValue[];
};

type ApiResponse = {
  items: ExerciseListItem[];
  nextPage: number | null;
  total: number;
};

export function ExerciseBrowser({
  facets,
  mode = "browse",
  selectedIds = [],
  onSelect,
  excludeIds = [],
}: {
  facets: Facets;
  mode?: "browse" | "select";
  selectedIds?: string[];
  onSelect?: (item: ExerciseListItem) => void;
  excludeIds?: string[];
}) {
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [bodyPart, setBodyPart] = React.useState<string>("");
  const [equipment, setEquipment] = React.useState<string>("");
  const [target, setTarget] = React.useState<string>("");
  const [customOnly, setCustomOnly] = React.useState(false);

  const [items, setItems] = React.useState<ExerciseListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState<number | null>(0);
  const [loading, setLoading] = React.useState(true);

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const exclude = React.useMemo(() => new Set(excludeIds), [excludeIds]);

  // Show the loading state from event handlers; the fetch effect turns it off.
  const markLoading = React.useCallback(() => setLoading(true), []);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const buildParams = React.useCallback(
    (p: number) => {
      const sp = new URLSearchParams();
      if (debouncedQ) sp.set("q", debouncedQ);
      if (bodyPart) sp.set("bodyPart", bodyPart);
      if (equipment) sp.set("equipment", equipment);
      if (target) sp.set("target", target);
      if (customOnly) sp.set("customOnly", "1");
      sp.set("page", String(p));
      return sp.toString();
    },
    [debouncedQ, bodyPart, equipment, target, customOnly],
  );

  // Reset + fetch first page when filters change. All state updates happen inside
  // promise callbacks (async boundaries) so the effect body stays side-effect free.
  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/exercises?${buildParams(0)}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPage(data.nextPage);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setItems([]);
          setTotal(0);
          setPage(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [buildParams]);

  const loadMore = React.useCallback(() => {
    if (page === null || loading) return;
    setLoading(true);
    fetch(`/api/exercises?${buildParams(page)}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        setItems((prev) => [...prev, ...data.items]);
        setPage(data.nextPage);
      })
      .finally(() => setLoading(false));
  }, [page, loading, buildParams]);

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const activeFilterCount = [equipment, target].filter(Boolean).length;
  const visibleItems = items.filter((it) => !exclude.has(it.id));

  return (
    <div>
      {/* Search + actions */}
      <div className="px-4 pt-3 pb-2 space-y-3 sticky top-14 z-20 bg-bg/90 backdrop-blur-lg">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            />
            <Input
              value={q}
              onChange={(e) => {
                markLoading();
                setQ(e.target.value);
              }}
              placeholder="Search exercises…"
              className="pl-9"
            />
            {q && (
              <button
                onClick={() => {
                  markLoading();
                  setQ("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-fg"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 relative"
            onClick={() => setFiltersOpen(true)}
            aria-label="Filters"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] flex items-center justify-center text-accent-fg">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {mode === "browse" && (
            <Button size="icon" className="h-10 w-10" onClick={() => setCreateOpen(true)} aria-label="New exercise">
              <Plus size={18} />
            </Button>
          )}
        </div>

        {/* Body part chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <Chip
            active={!bodyPart && !customOnly}
            onClick={() => {
              markLoading();
              setBodyPart("");
              setCustomOnly(false);
            }}
          >
            All
          </Chip>
          <Chip
            active={customOnly}
            onClick={() => {
              markLoading();
              setCustomOnly(true);
              setBodyPart("");
            }}
          >
            My exercises
          </Chip>
          {facets.bodyParts.map((bp) => (
            <Chip
              key={bp.value}
              active={bodyPart === bp.value && !customOnly}
              onClick={() => {
                markLoading();
                setCustomOnly(false);
                setBodyPart(bodyPart === bp.value ? "" : bp.value);
              }}
            >
              {titleCase(bp.value)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="px-5 pt-1 pb-2 text-xs text-subtle">
        {loading && items.length === 0 ? "Loading…" : `${total} exercise${total === 1 ? "" : "s"}`}
      </div>

      {/* List */}
      <div className="px-2">
        {visibleItems.map((item) =>
          mode === "select" ? (
            <ExerciseRow
              key={item.id}
              item={item}
              onClick={() => onSelect?.(item)}
              selected={selected.has(item.id)}
              trailing={
                selected.has(item.id) ? (
                  <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Check size={14} className="text-accent-fg" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border border-line-strong shrink-0" />
                )
              }
            />
          ) : (
            <ExerciseRow key={item.id} item={item} href={`/exercises/${item.id}`} />
          ),
        )}
      </div>

      {!loading && visibleItems.length === 0 && (
        <EmptyState
          title="No exercises found"
          description="Try a different search or filter, or create your own exercise."
          action={
            mode === "browse" ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> New exercise
              </Button>
            ) : undefined
          }
        />
      )}

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {loading && items.length > 0 && <Spinner />}
      </div>

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-6">
          <FilterGroup
            label="Equipment"
            options={facets.equipment}
            value={equipment}
            onChange={(v) => {
              markLoading();
              setEquipment(v);
            }}
          />
          <FilterGroup
            label="Target muscle"
            options={facets.targets}
            value={target}
            onChange={(v) => {
              markLoading();
              setTarget(v);
            }}
          />
        </div>
        <div className="flex gap-2 mt-8">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              markLoading();
              setEquipment("");
              setTarget("");
            }}
          >
            Clear
          </Button>
          <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
            Show {total} results
          </Button>
        </div>
      </Sheet>

      {mode === "browse" && (
        <CreateExerciseSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          facets={facets}
        />
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FacetValue[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip
            key={o.value}
            active={value === o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
          >
            {titleCase(o.value)} <span className="opacity-50">{o.count}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}
