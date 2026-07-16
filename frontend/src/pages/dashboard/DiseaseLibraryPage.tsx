import { Search, Loader2, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, Dna } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDiseaseLibrary } from "@/hooks/useDiseaseLibrary";

export default function DiseaseLibraryPage() {
  const {
    page,
    setPage,
    totalPages,
    totalCount,
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

    diseases,
  } = useDiseaseLibrary();

  const isLoading = isLoadingNames || isLoadingPage || isSearching;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Disease Library"
        description={`Browse the full catalog of ${totalCount || "thousands of"} hereditary genetic diseases.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Disease Library" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Search &amp; filter</CardTitle>
          <CardDescription>
            Search by disease name, or browse the full catalog page by page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="disease-library-search" className="sr-only">
              Search diseases
            </label>
            <input
              id="disease-library-search"
              type="text"
              placeholder="Type a disease name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSearchActive}
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              {sortDirection === "asc" ? "A → Z" : "Z → A"}
            </Button>

            <Button
              type="button"
              variant={inheritanceFilter === null ? "outline" : "ghost"}
              size="sm"
              onClick={() => setInheritanceFilter(null)}
              className={inheritanceFilter === null ? "border-brand-300 text-brand-700" : ""}
            >
              All inheritance types
            </Button>

            {inheritanceOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={inheritanceFilter === option ? "outline" : "ghost"}
                size="sm"
                onClick={() =>
                  setInheritanceFilter(inheritanceFilter === option ? null : option)
                }
                className={
                  inheritanceFilter === option ? "border-brand-300 text-brand-700" : ""
                }
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {namesError && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{namesError}</span>
        </div>
      )}

      {isLoading && diseases.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading diseases...
          </p>
        </div>
      ) : diseases.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-sm text-slate-500">No diseases match your search.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {diseases.map((disease) => (
            <Card key={disease.Disease}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Dna className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{disease.Disease}</CardTitle>
                    {disease.Gene_Name && (
                      <CardDescription>{disease.Gene_Name}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {disease.Gene && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Gene
                    </p>
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {disease.Gene}
                    </p>
                  </div>
                )}
                {disease.Age_Of_Onset && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Age of onset
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {disease.Age_Of_Onset}
                    </p>
                  </div>
                )}
                {disease.Inheritance_Type && (
                  <Badge variant="info">{disease.Inheritance_Type}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSearchActive && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}