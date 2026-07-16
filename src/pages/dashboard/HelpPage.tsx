import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Microscope,
  Brain,
  FlaskConical,
  Upload,
  FileText,
  LayoutDashboard,
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  BookOpen,
  Library,
  Code2,
  Activity,
  Keyboard,
  Shield,
  ExternalLink,
  Siren,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";

type StatusState = "online" | "offline" | "maintenance";

interface QuickHelp {
  id: string;
  title: string;
  description: string;
  icon: typeof Microscope;
  tag: string;
}

interface FAQ {
  id: string;
  q: string;
  a: string;
  tags: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: typeof PlayCircle;
  href: string;
  badge?: string;
}

interface StatusItem {
  id: string;
  name: string;
  state: StatusState;
  helper: string;
}

interface Shortcut {
  keys: string[];
  label: string;
}

const QUICK_HELP: QuickHelp[] = [
  {
    id: "qh1",
    title: "Disease Analysis",
    description:
      "Run comprehensive genetic disease screening from uploaded samples.",
    icon: Microscope,
    tag: "disease",
  },
  {
    id: "qh2",
    title: "AI Risk Assessment",
    description:
      "Understand how our AI computes polygenic and monogenic risk scores.",
    icon: Brain,
    tag: "ai",
  },
  {
    id: "qh3",
    title: "CRISPR Recommendation",
    description:
      "Explore recommended CRISPR strategies for identified variants.",
    icon: FlaskConical,
    tag: "crispr",
  },
  {
    id: "qh4",
    title: "DNA Upload",
    description:
      "Upload FASTQ, VCF, BAM and other supported formats securely.",
    icon: Upload,
    tag: "upload",
  },
  {
    id: "qh5",
    title: "Reports",
    description:
      "Generate, share, and download clinical-grade genomic reports.",
    icon: FileText,
    tag: "reports",
  },
  {
    id: "qh6",
    title: "Dashboard",
    description: "Navigate insights, saved cases, and recent activity.",
    icon: LayoutDashboard,
    tag: "dashboard",
  },
];

const FAQS: FAQ[] = [
  {
    id: "faq1",
    q: "How do I upload DNA?",
    a: "Open the DNA Upload page from the sidebar, then drag your file into the drop zone or click Browse. PreGene-AI validates the file, hashes it locally, and begins analysis automatically once the upload completes.",
    tags: ["upload"],
  },
  {
    id: "faq2",
    q: "Which file formats are supported?",
    a: "We support FASTQ, FASTA, VCF, BAM and CRAM files. Gzip or bzip2 compressed variants (.gz, .bz2) are also accepted up to 5 GB per upload.",
    tags: ["upload"],
  },
  {
    id: "faq3",
    q: "How accurate is AI prediction?",
    a: "Our models achieve 92–96% concordance with expert clinical review on internal validation cohorts. Confidence intervals are shown alongside every prediction so clinicians can weigh results appropriately.",
    tags: ["ai"],
  },
  {
    id: "faq4",
    q: "Can AI diagnose diseases?",
    a: "PreGene-AI provides decision support only. All findings must be reviewed and confirmed by a qualified clinician before informing any clinical decision or treatment plan.",
    tags: ["ai", "disease"],
  },
  {
    id: "faq5",
    q: "What datasets are used?",
    a: "Models are trained on de-identified public and licensed datasets including gnomAD, ClinVar, 1000 Genomes, and partner hospital cohorts under IRB approval.",
    tags: ["ai"],
  },
  {
    id: "faq6",
    q: "How do I download reports?",
    a: "Open any completed analysis and use the Download menu in the report toolbar to export as PDF, DOCX, or FHIR-compatible JSON.",
    tags: ["reports"],
  },
  {
    id: "faq7",
    q: "Can I export results?",
    a: "Yes. Individual reports export from the case view, and bulk exports of your entire analysis history are available from Settings → Data & Privacy as a JSON archive.",
    tags: ["reports"],
  },
  {
    id: "faq8",
    q: "How is my data protected?",
    a: "All data is encrypted in transit using TLS 1.3 and at rest with AES-256. Access is role-based, audit-logged, and compliant with HIPAA and GDPR requirements.",
    tags: ["privacy"],
  },
];

const TUTORIALS: Tutorial[] = [
  {
    id: "t1",
    title: "Video Tutorials",
    description: "Guided walkthroughs of every core workflow.",
    icon: PlayCircle,
    href: "/tutorials/videos",
    badge: "12 videos",
  },
  {
    id: "t2",
    title: "Documentation",
    description: "Detailed product and clinical documentation.",
    icon: BookOpen,
    href: "/docs",
  },
  {
    id: "t3",
    title: "Research Library",
    description: "Peer-reviewed studies powering our models.",
    icon: Library,
    href: "/research",
  },
  {
    id: "t4",
    title: "API Docs",
    description: "Integrate PreGene-AI into your EHR or LIS.",
    icon: Code2,
    href: "/docs/api",
    badge: "v2",
  },
];

const STATUS_ITEMS: StatusItem[] = [
  {
    id: "backend",
    name: "Backend API",
    state: "online",
    helper: "Response < 120ms",
  },
  {
    id: "frontend",
    name: "Web App",
    state: "online",
    helper: "Global CDN healthy",
  },
  {
    id: "database",
    name: "Database",
    state: "online",
    helper: "Replication lag 0s",
  },
  {
    id: "ai",
    name: "AI Engine",
    state: "maintenance",
    helper: "Scheduled model refresh",
  },
  {
    id: "auth",
    name: "Authentication",
    state: "online",
    helper: "SSO operational",
  },
];

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["G", "D"], label: "Go to Dashboard" },
  { keys: ["G", "U"], label: "Go to DNA Upload" },
  { keys: ["G", "R"], label: "Go to Reports" },
  { keys: ["G", "H"], label: "Open Help Center" },
  { keys: ["⌘", "/"], label: "Focus search" },
  { keys: ["?"], label: "Show all shortcuts" },
  { keys: ["Esc"], label: "Close modal or menu" },
];

const PRIVACY_LINKS: { label: string; href: string; description: string }[] = [
  {
    label: "Privacy Policy",
    href: "/privacy",
    description: "How we collect, use, and safeguard your information.",
  },
  {
    label: "Terms of Service",
    href: "/terms",
    description: "The agreement that governs your use of PreGene-AI.",
  },
  {
    label: "Data Usage",
    href: "/data-usage",
    description: "Understand how genomic data is processed and stored.",
  },
];

const EMERGENCY_CONTACTS: { label: string; value: string; href: string }[] = [
  { label: "Emergency (24/7)", value: "+1 800 555 0110", href: "tel:+18005550110" },
  { label: "Poison Control", value: "+1 800 222 1222", href: "tel:+18002221222" },
  { label: "Clinical On-Call", value: "clinical@pregene.ai", href: "mailto:clinical@pregene.ai" },
];

const MAX_FEEDBACK = 600;
const MIN_FEEDBACK = 10;

function statusStyles(state: StatusState) {
  if (state === "online") {
    return {
      dot: "bg-emerald-500",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
      label: "Online",
    };
  }
  if (state === "maintenance") {
    return {
      dot: "bg-amber-500",
      pill: "bg-amber-50 text-amber-700 border-amber-100",
      label: "Maintenance",
    };
  }
  return {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 border-red-100",
    label: "Offline",
  };
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const faqSectionRef = useRef<HTMLElement | null>(null);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q)),
    );
  }, [query]);

  function toggleFaq(id: string) {
    setOpenFaq((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpenGuide(item: QuickHelp) {
    setQuery(item.tag);
    const related = FAQS.filter((f) => f.tags.includes(item.tag)).map(
      (f) => f.id,
    );
    setOpenFaq(new Set(related));
    requestAnimationFrame(() => {
      faqSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleFeedbackSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSent(false);

    const trimmed = feedback.trim();
    if (trimmed.length < MIN_FEEDBACK) {
      setFeedbackError(
        `Please share at least ${MIN_FEEDBACK} characters so we can help.`,
      );
      return;
    }
    if (trimmed.length > MAX_FEEDBACK) {
      setFeedbackError(
        `Feedback must be under ${MAX_FEEDBACK} characters.`,
      );
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSubmitting(false);
    setFeedback("");
    setFeedbackSent(true);
  }

  const feedbackCount = feedback.length;
  const feedbackNearLimit = feedbackCount > MAX_FEEDBACK * 0.85;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Help Center"
        description="Find guides, documentation, FAQs, and support resources."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help" },
        ]}
      />

      {/* Search */}
      <section
        aria-label="Search help"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              How can we help?
            </h3>
            <p className="text-sm text-slate-500">
              Search FAQs, guides, and product documentation.
            </p>
          </div>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for uploads, reports, AI, privacy..."
            aria-label="Search help articles"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>

        {query.trim() && (
          <p className="mt-3 text-xs text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {filteredFaqs.length}
            </span>{" "}
            of {FAQS.length} FAQs for
            <span className="mx-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
              {query.trim()}
            </span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="ml-1 text-brand-600 hover:underline"
            >
              Clear
            </button>
          </p>
        )}
      </section>

      {/* Quick Help Cards */}
      <section aria-label="Quick help">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Quick Help</h3>
          <p className="text-sm text-slate-500">
            Jump into the most common workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_HELP.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {item.title}
                </h4>
                <p className="mt-1 flex-1 text-sm text-slate-500">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenGuide(item)}
                  className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Open Guide
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section
        ref={faqSectionRef}
        aria-label="Frequently asked questions"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-slate-500">
              Answers to the questions we hear most from clinicians and
              researchers.
            </p>
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No matching articles"
            description="Try a different search term or clear the query to see all FAQs."
          />
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((f) => {
              const open = openFaq.has(f.id);
              return (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(f.id)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${f.id}`}
                    id={`faq-trigger-${f.id}`}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <div
                      id={`faq-panel-${f.id}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${f.id}`}
                      className="border-t border-slate-100 bg-slate-50/40 px-4 py-3"
                    >
                      <p className="text-sm leading-relaxed text-slate-600">
                        {f.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contact Support */}
      <section
        aria-label="Contact support"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Contact Support
            </h3>
            <p className="text-sm text-slate-500">
              Our clinical support team is available for account and product
              questions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </p>
              <a
                href="mailto:support@pregene.ai"
                className="text-sm font-medium text-slate-900 hover:text-brand-600"
              >
                support@pregene.ai
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone
              </p>
              <a
                href="tel:+18005557436"
                className="text-sm font-medium text-slate-900 hover:text-brand-600"
              >
                +1 (800) 555-7436
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Office Hours
              </p>
              <p className="text-sm font-medium text-slate-900">
                Mon–Fri, 8:00 AM – 8:00 PM IST
              </p>
              <p className="text-xs text-slate-500">
                24/7 clinical on-call for urgent cases
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Hospital Address
              </p>
              <p className="text-sm font-medium text-slate-900">
                PreGene Genomics Institute
              </p>
              <p className="text-xs text-slate-500">
                4th Floor, Innovation Block, Bengaluru 560103, India
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <a
            href="mailto:support@pregene.ai"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Mail className="h-4 w-4" />
            Open Email
          </a>
        </div>
      </section>

      {/* Feedback */}
      <section
        aria-label="Send feedback"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Feedback</h3>
            <p className="text-sm text-slate-500">
              Tell us what's working, what's confusing, and what you'd like to
              see next.
            </p>
          </div>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="sr-only">
              Feedback
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setFeedbackError(null);
                setFeedbackSent(false);
              }}
              rows={5}
              maxLength={MAX_FEEDBACK + 40}
              placeholder="Share a bug, an idea, or a compliment..."
              className="block w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Minimum {MIN_FEEDBACK} characters.
              </span>
              <span
                className={
                  feedbackNearLimit ? "text-amber-600" : "text-slate-400"
                }
              >
                {feedbackCount} / {MAX_FEEDBACK}
              </span>
            </div>
          </div>

          {feedbackError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}
          {feedbackSent && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Thanks for the feedback. Our team will review it shortly.</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Tutorials */}
      <section aria-label="Tutorials and resources">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Tutorials</h3>
          <p className="text-sm text-slate-500">
            Learn PreGene-AI at your own pace.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TUTORIALS.map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.id}
                href={t.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  {t.badge && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {t.badge}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600">
                  {t.title}
                </h4>
                <p className="mt-1 flex-1 text-sm text-slate-500">
                  {t.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* System Status */}
      <section
        aria-label="System status"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                System Status
              </h3>
              <p className="text-sm text-slate-500">
                Real-time status of PreGene-AI infrastructure.
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All core systems operational
          </span>
        </div>

        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {STATUS_ITEMS.map((s) => {
            const styles = statusStyles(s.state);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-500">{s.helper}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.pill}`}
                >
                  {styles.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Keyboard Shortcuts */}
      <section
        aria-label="Keyboard shortcuts"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Keyboard Shortcuts
            </h3>
            <p className="text-sm text-slate-500">
              Move through PreGene-AI without leaving your keyboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-2.5"
            >
              <span className="text-sm text-slate-700">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={`${s.label}-${i}`}
                    className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section
        aria-label="Privacy and legal"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Privacy &amp; Legal
            </h3>
            <p className="text-sm text-slate-500">
              Understand how PreGene-AI safeguards your data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRIVACY_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                  {link.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {link.description}
                </p>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-600" />
            </a>
          ))}
        </div>
      </section>

      {/* Emergency Support */}
      <section
        aria-label="Emergency support"
        className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-red-100 p-3 text-red-600">
            <Siren className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">
              Emergency Support
            </h3>
            <p className="text-sm text-red-800/80">
              PreGene-AI is a decision-support tool. Use these contacts for
              urgent clinical situations.
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Medical Disclaimer
            </p>
            <p className="mt-1 text-sm text-red-800/80">
              PreGene-AI does not provide medical advice, diagnosis, or
              treatment. In a medical emergency, contact your local emergency
              services immediately. All AI outputs must be verified by a
              qualified clinician before informing care.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {EMERGENCY_CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-white p-4 transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                  {c.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-red-900">
                  {c.value}
                </p>
              </div>
              <Phone className="h-4 w-4 text-red-600" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
