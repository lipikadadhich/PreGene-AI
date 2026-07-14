import { HelpCircle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help Center"
        description="Find guides, documentation, FAQs, and support resources."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Help" }]}
      />
      <EmptyState
        icon={HelpCircle}
        title="Help center coming soon"
        description="Guides, FAQs, and support contact options will be available here."
      />
    </div>
  );
}
