import { useEffect, useMemo, useState } from "react";
import {
  getDiseaseList,
  getDiseaseDetail,
  searchDisease,
  type DiseaseDetailResponse,
} from "@/services/api";

export interface DiseaseSummary {
  Disease: string;
  Gene?: string;
  Gene_Name?: string;
  Age_Of_Onset?: string;
  Inheritance_Type?: string;
}

const PAGE_SIZE = 12;

/**
 * The backend exposes:
 *  - GET /diseases        → full list of ~4,000 disease NAMES only
 *  - GET /disease/{name}   → full clinical record for ONE disease
 *  - GET /search?q=        → up to 10 full records matching a substring
 *
 * There's no "list all diseases with full detail" endpoint, so this hook
 * fetches names once, then lazily fetches full detail only for whichever
 * page is currently visible (bounded to PAGE_SIZE parallel requests).
 * When a search query is active, it defers entirely to /search, which
 * already returns full detail for its matches.
 */
export function useDiseaseLibrary() {
  const [allNames, setAllNames] = useState<string[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [namesError, setNamesError] = useState<string | null>(null);

  const [detailCache, setDetailCache] = useState<Map<string, DiseaseSummary>>(
    new Map()
  );
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [inheritanceFilter, setInheritanceFilter] = useState<string | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiseaseSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load the full disease name list once.
  useEffect(() => {
    let cancelled = false;
    setIsLoadingNames(true);
    getDiseaseList()
      .then((res) => {
        if (cancelled) return;
        setAllNames(res.diseases);
        setNamesError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setNamesError(
            "Could not load the disease list. Confirm the backend is running."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingNames(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedNames = useMemo(() => {
    const copy = [...allNames];
    copy.sort((a, b) =>
      sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a)
    );
    return copy;
  }, [allNames, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedNames.length / PAGE_SIZE));

  const pageNames = useMemo(
    () => sortedNames.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedNames, page]
  );

  // Fetch detail for whichever names are on the current page and not yet cached.
  useEffect(() => {
    const missing = pageNames.filter((name) => !detailCache.has(name));
    if (missing.length === 0) return;

    let cancelled = false;
    setIsLoadingPage(true);

    Promise.all(
      missing.map((name) =>
        getDiseaseDetail(name)
          .then((detail) => [name, detail] as const)
          .catch(() => [name, null] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      setDetailCache((prev) => {
        const next = new Map(prev);
        for (const [name, detail] of results) {
          if (detail && detail.found) {
            next.set(name, {
              Disease: detail.Disease || name,
              Gene: detail.Gene,
              Gene_Name: detail.Gene_Name,
              Age_Of_Onset: detail.Age_Of_Onset,
              Inheritance_Type: detail.Inheritance_Type,
            });
          } else {
            next.set(name, { Disease: name });
          }
        }
        return next;
      });
      setIsLoadingPage(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNames]);

  // Run a live search when the query is long enough.
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchDisease(searchQuery.trim())
      .then((results: any[]) => {
        if (cancelled) return;
        setSearchResults(
          results.map((r) => ({
            Disease: r.Disease,
            Gene: r.Gene,
            Gene_Name: r.Gene_Name,
            Age_Of_Onset: r.Age_Of_Onset,
            Inheritance_Type: r.Inheritance_Type,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const isSearchActive = searchQuery.trim().length >= 2;

  const visibleDiseases: DiseaseSummary[] = isSearchActive
    ? searchResults
    : pageNames.map(
        (name) => detailCache.get(name) ?? { Disease: name }
      );

  const inheritanceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const detail of detailCache.values()) {
      if (detail.Inheritance_Type) {
        detail.Inheritance_Type.split(",").forEach((t) => set.add(t.trim()));
      }
    }
    return Array.from(set).sort();
  }, [detailCache]);

  const filteredDiseases = inheritanceFilter
    ? visibleDiseases.filter((d) =>
        (d.Inheritance_Type || "").toLowerCase().includes(
          inheritanceFilter.toLowerCase()
        )
      )
    : visibleDiseases;

  return {
    page,
    setPage,
    totalPages,
    totalCount: allNames.length,
    isLoadingNames,
    isLoadingPage,
    namesError,
    sortDirection,
    setSortDirection,
    inheritanceFilter,
    setInheritanceFilter,
    inheritanceOptions,

    searchQuery,
    setSearchQuery,
    isSearchActive,
    isSearching,

    diseases: filteredDiseases,
  };
}