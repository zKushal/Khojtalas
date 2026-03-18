"use client";

import { useEffect, useMemo, useState } from "react";
import PendingItemCard from "../../../components/PendingItemCard";
import { approveItem, getPendingItems, rejectItem } from "../../../lib/adminApi";
import type { PendingItem } from "../../../types";

type Filter = "all" | "LOST" | "FOUND" | "urgent";

const filterOptions: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Lost", value: "LOST" },
  { label: "Found", value: "FOUND" },
  { label: "🚨 Urgent", value: "urgent" },
];

export default function PendingPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setError("");

      try {
        const pendingItems = await getPendingItems();
        setItems(pendingItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load pending items.");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "urgent") return item.isUrgent;
        if (filter === "all") return true;
        return item.status === filter;
      }),
    [filter, items]
  );

  const handleApprove = async (id: string) => {
    setActiveItemId(id);

    try {
      await approveItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve item.");
    } finally {
      setActiveItemId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActiveItemId(id);

    try {
      await rejectItem(id, reason);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject item.");
    } finally {
      setActiveItemId(null);
    }
  };

  const handleMarkUrgent = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isUrgent: true } : i)));

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Pending Reports</h2>
          <p className="text-sm text-silver/60">
            {items.length} item{items.length !== 1 && "s"} awaiting review
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filter === opt.value
                  ? "bg-cyan/15 text-cyan"
                  : "border border-white/10 bg-white/5 text-silver/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-silver/60">
          Loading pending items...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-silver/60">
          No items match this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={activeItemId === item.id ? "pointer-events-none opacity-70" : ""}
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
  );
}
