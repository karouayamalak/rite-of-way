import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, ShieldAlert, Cpu } from "lucide-react";
import { api } from "@/lib/api";

interface ActivityLog {
  _id: string;
  admin: string;
  adminName: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  PRODUCT_CREATE: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  PRODUCT_UPDATE: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  PRODUCT_DELETE: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  ORDER_STATUS_UPDATE: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  SETTINGS_UPDATE: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  COUPON_CREATE: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
  COUPON_DELETE: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
};

const AdminActivityLogs = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity-logs", page],
    queryFn: () =>
      api.get<{
        success: boolean;
        data: ActivityLog[];
        pagination: { total: number; pages: number };
      }>(`/admin/activity-logs?page=${page}&limit=20`),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-secondary animate-pulse" />
        <div className="h-96 w-full bg-secondary animate-pulse" />
      </div>
    );
  }

  const formatAction = (act: string) => act.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-light tracking-[2px] flex items-center gap-2">
          <History size={20} className="text-accent" /> AUDIT LOGS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review chronological changes and security logs for administrator actions</p>
      </div>

      {/* Table */}
      <div className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-secondary text-xs uppercase tracking-[1px] text-muted-foreground">
                <th className="px-6 py-4.5 font-normal">Timestamp</th>
                <th className="px-6 py-4.5 font-normal">Administrator</th>
                <th className="px-6 py-4.5 font-normal">Operation</th>
                <th className="px-6 py-4.5 font-normal">Description</th>
                <th className="px-6 py-4.5 font-normal">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-foreground whitespace-nowrap">
                      {log.adminName}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 border text-[10px] font-semibold uppercase tracking-[0.5px] ${
                          actionColors[log.action] ||
                          "text-muted-foreground bg-secondary border-border"
                        }`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground max-w-sm truncate text-xs" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4 font-sans">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 text-xs border transition-colors cursor-pointer rounded-none font-medium ${
                p === page
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground bg-transparent text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogs;
