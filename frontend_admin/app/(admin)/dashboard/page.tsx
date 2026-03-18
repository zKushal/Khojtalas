"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MetricsCard from "../../../components/MetricsCard";
import PendingItemCard from "../../../components/PendingItemCard";
import {
  approveItem,
  getDashboardStats,
  getPendingItems,
  getSuspiciousReports,
  rejectItem,
} from "../../../lib/adminApi";
import type { MetricsSummary, PendingItem, SuspiciousReport } from "../../../types";

const metricsConfig = [
  {
    title: "Total Reports",
    key: "totalReports" as const,
    accent: "white" as const,
    description: "All time",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Pending Approvals",
    key: "pendingApprovals" as const,
    accent: "magenta" as const,
    description: "Awaiting review",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Verified Items",
    key: "verifiedItems" as const,
    accent: "cyan" as const,
    description: "Approved & live",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: "Total Users",
    key: "totalUsers" as const,
    accent: "white" as const,
    description: "Registered accounts",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M21 20c0-3-1.5-4.5-4-5" />
      </svg>
    ),
  },
  {
    title: "Urgent Cases",
    key: "urgentCases" as const,
    accent: "magenta" as const,
    description: "Need immediate attention",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [reports, setReports] = useState<SuspiciousReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setError("");

    try {
      const [statsResponse, pendingResponse, reportsResponse] = await Promise.all([
        getDashboardStats(),
        getPendingItems(),
        getSuspiciousReports(),
      ]);

      setMetrics(statsResponse);
      setPendingItems(pendingResponse.slice(0, 3));
      setReports(reportsResponse.slice(0, 5));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metricsValue = useMemo<MetricsSummary>(
    () =>
      metrics || {
        totalReports: 0,
        pendingApprovals: 0,
        verifiedItems: 0,
        totalUsers: 0,
        urgentCases: 0,
        totalLostItems: 0,
        totalFoundItems: 0,
      },
    [metrics]
  );

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);

    try {
      await approveItem(id);
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              pendingApprovals: Math.max(prev.pendingApprovals - 1, 0),
              verifiedItems: prev.verifiedItems + 1,
            }
          : prev
      );
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoadingId(id);

    try {
      await rejectItem(id, reason);
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              pendingApprovals: Math.max(prev.pendingApprovals - 1, 0),
            }
          : prev
      );
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkUrgent = (id: string) =>
    setPendingItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isUrgent: true } : i))
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Overview</h2>
        <p className="text-sm text-silver/60">Platform health at a glance</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metricsConfig.map((m) => (
          <MetricsCard
            key={m.title}
            title={m.title}
            value={loading ? "—" : metricsValue[m.key]}
            icon={m.icon}
            accent={m.accent}
            description={m.description}
          />
        ))}
      </div>

      {/* Recent pending */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Pending Items</h2>
          <Link href="/pending" className="text-xs text-cyan/80 transition hover:text-cyan hover:underline underline-offset-2">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-sm text-silver/60">
            Loading pending items...
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-sm text-silver/60">
            All caught up — no pending items.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className={actionLoadingId === item.id ? "pointer-events-none opacity-70" : ""}
              >
                <PendingItemCard
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onMarkUrgent={handleMarkUrgent}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Reports</h2>
          <span className="text-xs text-silver/60">Up to 5 latest entries</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-sm text-silver/60">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-sm text-silver/60">
            No suspicious reports found.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-magenta/15 px-2.5 py-1 text-[11px] font-semibold text-magenta">
                    {report.status}
                  </span>
                  <span className="text-[11px] text-silver/55">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Unknown time"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {report.itemTitle || "Item reference unavailable"}
                </p>
                <p className="mt-1 text-xs text-silver/70">{report.reason}</p>
                <p className="mt-3 text-[11px] text-silver/55">
                  Reporter: {report.reporterName || "Unknown user"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
