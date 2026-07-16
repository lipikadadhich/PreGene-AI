import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  X,
  Upload,
  FlaskConical,
  FileText,
  Download,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
  type NotificationType,
} from "@/services/api";

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  dna_uploaded: Upload,
  dna_upload_failed: AlertCircle,
  analysis_started: FlaskConical,
  analysis_completed: FlaskConical,
  analysis_failed: AlertCircle,
  report_generated: FileText,
  report_downloaded: Download,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  dna_uploaded: "bg-brand-50 text-brand-600",
  dna_upload_failed: "bg-red-50 text-red-600",
  analysis_started: "bg-sky-50 text-sky-600",
  analysis_completed: "bg-emerald-50 text-emerald-600",
  analysis_failed: "bg-red-50 text-red-600",
  report_generated: "bg-brand-50 text-brand-600",
  report_downloaded: "bg-slate-100 text-slate-600",
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadNotifications() {
    setIsLoading(true);
    setError(null);
    getNotifications()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count);
      })
      .catch(() => setError("Could not load notifications."))
      .finally(() => setIsLoading(false));
  }

  // Refresh once on page load, per the V1 "no polling" design — this
  // gives an accurate unread count in the bell badge without opening
  // the dropdown first.
  useEffect(() => {
    loadNotifications();
  }, []);

  // Close on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      // Refresh every time the dropdown is opened, per the V1 design.
      loadNotifications();
    }
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Non-critical — navigation still proceeds even if marking read fails.
      }
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      setError("Could not mark all as read.");
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch {
      setError("Could not delete notification.");
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-900/[0.03]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-4 py-3">
            <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-ink-200" />
                <p className="mt-2 text-sm text-ink-400">No notifications yet</p>
                <p className="mt-1 text-xs text-ink-300">
                  Uploads, analyses, and reports will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.05]">
                {notifications.map((item) => {
                  const Icon = TYPE_ICONS[item.type] || Bell;
                  const colorClasses = TYPE_COLORS[item.type] || "bg-slate-100 text-slate-600";

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-900/[0.02] ${
                          !item.is_read ? "bg-brand-50/40" : ""
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorClasses}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                !item.is_read
                                  ? "font-semibold text-ink-900"
                                  : "font-medium text-ink-700"
                              }`}
                            >
                              {item.title}
                            </p>
                            {!item.is_read && (
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                            {item.message}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-300">
                            {formatRelativeTime(item.created_at)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="flex-shrink-0 rounded-md p-1 text-ink-300 opacity-0 hover:bg-ink-900/[0.05] hover:text-ink-600 group-hover:opacity-100"
                          aria-label="Delete notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}