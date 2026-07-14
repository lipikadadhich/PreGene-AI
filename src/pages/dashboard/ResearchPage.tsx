import PageHeader from "@/components/common/PageHeader";

export default function ResearchPage() {
  return (
    <div>
      <PageHeader
        title="Research Library"
        description="Browse peer-reviewed genomics and reproductive medicine research."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Research" }]}
      />
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-ink-900/15 bg-white p-10 text-center">
        <p className="text-sm text-ink-500">
          The Research experience will be built here.
        </p>
      </div>
    </div>
  );
}
