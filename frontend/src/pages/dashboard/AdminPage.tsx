import { ShieldAlert } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Administration"
        description="Manage administrative tools, users, and platform configuration."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }]}
      />
      <EmptyState
        icon={ShieldAlert}
        title="Administration panel coming soon"
        description="Administrative tools, user management, and platform configuration options will be available here."
      />
    </div>
  );
}
