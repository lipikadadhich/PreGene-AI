import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  BookOpen,
  Brain,
  Database,
  TrendingUp,
  Dna,
  FlaskConical,
  Microscope,
  HeartPulse,
  Layers,
  Star,
  Filter,
  ArrowUpRight,
  Download,
  Share2,
  Bell,
  FileText,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

type ResearchCategory =
  | "AI"
  | "CRISPR"
  | "Genetics"
  | "Genomics"
  | "Rare Diseases"
  | "Gene Therapy";

interface ResearchPaper {
  id: string;
  title: string;
  journal: string;
  year: number;
  category: ResearchCategory;
  description: string;
  featured?: boolean;
  authors?: string;
  readingTime?: string;
  url?: string;
}

interface CategoryConfig {
  label: ResearchCategory;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  soft: string;
  description: string;
}

interface StatCard {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  soft: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: "AI",
    icon: Brain,
    accent: "text-emerald-700",
    soft: "bg-emerald-50 border-emerald-100",
    description: "Machine learning in clinical genomics",
  },
  {
    label: "CRISPR",
    icon: FlaskConical,
    accent: "text-sky-700",
    soft: "bg-sky-50 border-sky-100",
    description: "Precision genome editing research",
  },
  {
    label: "Genetics",
    icon: Dna,
    accent: "text-teal-700",
    soft: "bg-teal-50 border-teal-100",
    description: "Inheritance, variants and expression",
  },
  {
    label: "Genomics",
    icon: Microscope,
    accent: "text-indigo-700",
    soft: "bg-indigo-50 border-indigo-100",
    description: "Whole-genome and exome insights",
  },
  {
    label: "Rare Diseases",
    icon: HeartPulse,
    accent: "text-rose-700",
    soft: "bg-rose-50 border-rose-100",
    description: "Orphan conditions and diagnostics",
  },
  {
    label: "Gene Therapy",
    icon: Layers,
    accent: "text-amber-700",
    soft: "bg-amber-50 border-amber-100",
    description: "Therapeutic vectors and trials",
  },
];

const LOCAL_PAPERS: ResearchPaper[] = [
  {
    id: "p1",
    title:
      "Deep learning models for preimplantation embryo aneuploidy prediction",
    journal: "Nature Medicine",
    year: 2025,
    category: "AI",
    description:
      "A multi-center study validating a transformer-based model that predicts aneuploidy risk from time-lapse embryo imaging with 92% sensitivity.",
    featured: true,
    authors: "Chen L. et al.",
    readingTime: "12 min read",
  },
  {
    id: "p2",
    title:
      "Base editing corrects pathogenic BRCA1 variants in patient-derived organoids",
    journal: "Cell",
    year: 2025,
    category: "CRISPR",
    description:
      "Adenine base editors restore BRCA1 function in breast tissue organoids, showing durable rescue over 90 days without detectable off-target activity.",
    featured: true,
    authors: "Okafor R. et al.",
    readingTime: "9 min read",
  },
  {
    id: "p3",
    title:
      "Polygenic risk scores in reproductive counseling: a clinical framework",
    journal: "The Lancet",
    year: 2024,
    category: "Genetics",
    description:
      "Guidelines and evidence review for integrating polygenic risk scoring into preconception and prenatal counseling workflows.",
    authors: "Martins A. et al.",
    readingTime: "15 min read",
  },
  {
    id: "p4",
    title:
      "Long-read sequencing resolves structural variants in idiopathic infertility",
    journal: "Genome Research",
    year: 2025,
    category: "Genomics",
    description:
      "Nanopore sequencing uncovers previously invisible inversions and repeat expansions linked to unexplained male infertility.",
    featured: true,
    authors: "Novak D. et al.",
    readingTime: "11 min read",
  },
  {
    id: "p5",
    title:
      "Newborn screening expansion for ultra-rare metabolic disorders",
    journal: "New England Journal of Medicine",
    year: 2024,
    category: "Rare Diseases",
    description:
      "A prospective cohort of 120,000 newborns evaluating an expanded 400-gene panel and its impact on early intervention outcomes.",
    authors: "Ibarra S. et al.",
    readingTime: "10 min read",
  },
  {
    id: "p6",
    title:
      "AAV9-mediated gene therapy for spinal muscular atrophy: 5-year outcomes",
    journal: "JAMA Neurology",
    year: 2025,
    category: "Gene Therapy",
    description:
      "Long-term follow-up of infants treated with onasemnogene abeparvovec, showing sustained motor milestone achievement and safety.",
    authors: "Petrova K. et al.",
    readingTime: "8 min read",
  },
  {
    id: "p7",
    title:
      "Federated learning for privacy-preserving multi-hospital genomic models",
    journal: "npj Digital Medicine",
    year: 2024,
    category: "AI",
    description:
      "A federated framework enabling ten hospitals to jointly train variant pathogenicity models without sharing patient-level data.",
    authors: "Yamamoto H. et al.",
    readingTime: "7 min read",
  },
  {
    id: "p8",
    title:
      "Prime editing in human hematopoietic stem cells for sickle cell disease",
    journal: "Science",
    year: 2024,
    category: "CRISPR",
    description:
      "Prime editors achieve therapeutic correction of the sickle mutation in CD34+ cells, sustaining edits after xenotransplantation.",
    authors: "Bello F. et al.",
    readingTime: "13 min read",
  },
  {
    id: "p9",
    title:
      "Mitochondrial donation and long-term child neurodevelopment",
    journal: "The Lancet",
    year: 2025,
    category: "Genetics",
    description:
      "The first cohort of children born via mitochondrial replacement therapy shows neurodevelopmental trajectories comparable to controls at age five.",
    authors: "Andersen T. et al.",
    readingTime: "9 min read",
  },
  {
    id: "p10",
    title:
      "Single-cell atlas of the human endometrium across the menstrual cycle",
    journal: "Nature",
    year: 2024,
    category: "Genomics",
    description:
      "A high-resolution atlas identifying novel cell states associated with implantation success and recurrent pregnancy loss.",
    featured: true,
    authors: "Kaur P. et al.",
    readingTime: "14 min read",
  },
  {
    id: "p11",
    title:
      "Whole-genome sequencing as a first-tier test for rare pediatric disorders",
    journal: "Genetics in Medicine",
    year: 2024,
    category: "Rare Diseases",
    description:
      "Comparative diagnostic yield of WGS versus exome sequencing across 3,200 undiagnosed pediatric cases in a national program.",
    authors: "Silva M. et al.",
    readingTime: "10 min read",
  },
  {
    id: "p12",
    title:
      "In vivo lipid nanoparticle delivery of gene editors to the liver",
    journal: "Nature Biotechnology",
    year: 2025,
    category: "Gene Therapy",
    description:
      "Optimized LNP formulations achieve durable hepatocyte editing in non-human primates, paving the way for single-dose metabolic therapies.",
    authors: "Rossi V. et al.",
    readingTime: "11 min read",
  },
];

async function fetchResearchPapers(): Promise<ResearchPaper[]> {
  return LOCAL_PAPERS;
}

const STATS: StatCard[] = [
  {
    label: "Research Papers",
    value: LOCAL_PAPERS.length.toString().padStart(2, "0"),
    helper: "Curated peer-reviewed sources",
    icon: BookOpen,
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
  },
  {
    label: "AI Studies",
    value: LOCAL_PAPERS.filter((p) => p.category === "AI").length
      .toString()
      .padStart(2, "0"),
    helper: "Applied ML in genomics",
    icon: Brain,
    accent: "text-sky-700",
    soft: "bg-sky-50",
  },
  {
    label: "Gene Databases",
    value: "24",
    helper: "PubMed, ClinVar, gnomAD & more",
    icon: Database,
    accent: "text-indigo-700",
    soft: "bg-indigo-50",
  },
  {
    label: "Trending Topic",
    value: "CRISPR",
    helper: "+38% reads this week",
    icon: TrendingUp,
    accent: "text-amber-700",
    soft: "bg-amber-50",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Export Reading List",
    description: "Download saved papers as PDF",
    icon: Download,
  },
  {
    label: "Share With Team",
    description: "Send collections to collaborators",
    icon: Share2,
  },
  {
    label: "Set Alerts",
    description: "Get notified on new publications",
    icon: Bell,
  },
  {
    label: "Submit a Paper",
    description: "Suggest research to our library",
    icon: FileText,
  },
];

const cardMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

function getCategoryConfig(category: ResearchCategory): CategoryConfig {
  return CATEGORIES.find((c) => c.label === category) ?? CATEGORIES[0];
}

interface ResearchCardProps {
  paper: ResearchPaper;
  saved: boolean;
  onToggleSave: (id: string) => void;
  variant?: "featured" | "default";
}

function ResearchCard({
  paper,
  saved,
  onToggleSave,
  variant = "default",
}: ResearchCardProps) {
  const cfg = getCategoryConfig(paper.category);
  const Icon = cfg.icon;
  const isFeatured = variant === "featured";

  return (
    <motion.article
      {...cardMotion}
      className={`group relative flex h-full flex-col justify-between rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isFeatured
          ? "border-emerald-100 shadow-sm"
          : "border-ink-900/10 hover:border-ink-900/20"
      }`}
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${cfg.soft}`}
            >
              <Icon className={`h-4 w-4 ${cfg.accent}`} />
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.soft} ${cfg.accent}`}
            >
              {paper.category}
            </span>
          </div>
          {paper.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              Featured
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold leading-snug text-ink-900 group-hover:text-emerald-700">
          {paper.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span className="font-medium text-ink-900/80">{paper.journal}</span>
          <span aria-hidden>•</span>
          <span>{paper.year}</span>
          {paper.authors && (
            <>
              <span aria-hidden>•</span>
              <span>{paper.authors}</span>
            </>
          )}
          {paper.readingTime && (
            <>
              <span aria-hidden>•</span>
              <span>{paper.readingTime}</span>
            </>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {paper.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-900/5 pt-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label={`Read article: ${paper.title}`}
        >
          Read Article
          <ExternalLink className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(paper.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save article"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            saved
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500"
              : "border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/20 hover:text-ink-900 focus-visible:ring-ink-900/20"
          }`}
        >
          {saved ? (
            <>
              <BookmarkCheck className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

export default function ResearchPage() {
  const [papers] = useState<ResearchPaper[]>(() => LOCAL_PAPERS);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    ResearchCategory | "All"
  >("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredPapers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.journal.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.authors ? p.authors.toLowerCase().includes(q) : false)
      );
    });
  }, [papers, query, activeCategory]);

  const featuredPapers = useMemo(
    () => filteredPapers.filter((p) => p.featured),
    [filteredPapers],
  );

  const recentPapers = useMemo(
    () =>
      [...filteredPapers]
        .filter((p) => !p.featured)
        .sort((a, b) => b.year - a.year),
    [filteredPapers],
  );

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
  };

  void fetchResearchPapers;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Research Library"
        description="Browse peer-reviewed genomics and reproductive medicine research."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Research" },
        ]}
      />

      <section
        aria-label="Research statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              {...cardMotion}
              className="flex items-start justify-between rounded-2xl border border-ink-900/10 bg-white p-5"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-ink-500">{stat.helper}</p>
              </div>
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.soft}`}
              >
                <Icon className={`h-5 w-5 ${stat.accent}`} />
              </span>
            </motion.div>
          );
        })}
      </section>

      <section
        aria-label="Search and filter research"
        className="rounded-2xl border border-ink-900/10 bg-white p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative flex w-full items-center lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search papers, journals, authors..."
              aria-label="Search research papers"
              className="h-11 w-full rounded-xl border border-ink-900/10 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-center gap-2 text-xs text-ink-500">
            <Filter className="h-3.5 w-3.5" />
            <span>
              Showing{" "}
              <span className="font-medium text-ink-900">
                {filteredPapers.length}
              </span>{" "}
              of {papers.length} papers
            </span>
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Research categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === "All"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/20 hover:text-ink-900"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.label;
            return (
              <button
                key={c.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(c.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? `${c.soft} ${c.accent} border-current/20`
                    : "border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/20 hover:text-ink-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {filteredPapers.length === 0 ? (
        <section
          aria-label="No results"
          className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-900/15 bg-white p-10 text-center"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <Search className="h-5 w-5 text-emerald-700" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-ink-900">
            No matching research found
          </h3>
          <p className="mt-1 max-w-md text-sm text-ink-500">
            Try adjusting your search terms or clearing the active category
            filter to explore the full library.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:border-ink-900/20"
          >
            Reset filters
          </button>
        </section>
      ) : (
        <>
          {featuredPapers.length > 0 && (
            <section aria-label="Featured research">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    <h2 className="text-lg font-semibold text-ink-900">
                      Featured Research
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    Hand-picked studies shaping precision reproductive care.
                  </p>
                </div>
                <span className="hidden text-xs text-ink-500 sm:inline">
                  {featuredPapers.length}{" "}
                  {featuredPapers.length === 1 ? "study" : "studies"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredPapers.map((paper) => (
                  <ResearchCard
                    key={paper.id}
                    paper={paper}
                    saved={savedIds.has(paper.id)}
                    onToggleSave={toggleSave}
                    variant="featured"
                  />
                ))}
              </div>
            </section>
          )}

          {recentPapers.length > 0 && (
            <section aria-label="Recent publications">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sky-700" />
                    <h2 className="text-lg font-semibold text-ink-900">
                      Recent Publications
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    Latest peer-reviewed additions to the library.
                  </p>
                </div>
                <span className="hidden text-xs text-ink-500 sm:inline">
                  {recentPapers.length}{" "}
                  {recentPapers.length === 1 ? "paper" : "papers"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentPapers.map((paper) => (
                  <ResearchCard
                    key={paper.id}
                    paper={paper}
                    saved={savedIds.has(paper.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section
        aria-label="Quick actions"
        className="rounded-2xl border border-ink-900/10 bg-white p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Manage your reading workflow in a few clicks.
            </p>
          </div>
          <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 sm:inline">
            {savedIds.size} saved
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="group flex items-start justify-between gap-3 rounded-xl border border-ink-900/10 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ink-900/20 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {action.description}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                  <Icon className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Research categories">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink-900">
            Research Categories
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Explore the library by focus area.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const count = papers.filter((p) => p.category === c.label).length;
            const active = activeCategory === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() =>
                  setActiveCategory(active ? "All" : (c.label as ResearchCategory))
                }
                aria-pressed={active}
                className={`group flex items-center justify-between rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  active
                    ? "border-emerald-200 shadow-sm"
                    : "border-ink-900/10 hover:border-ink-900/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${c.soft}`}
                  >
                    <Icon className={`h-5 w-5 ${c.accent}`} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {c.label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {c.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-ink-500">
                      {count} {count === 1 ? "paper" : "papers"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-500 transition-colors group-hover:text-ink-900" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
