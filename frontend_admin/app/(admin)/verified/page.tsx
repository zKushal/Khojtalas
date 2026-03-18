"use client";

import { useEffect, useMemo, useState } from "react";
import VerifiedItemCard from "../../../components/VerifiedItemCard";
import { getVerifiedItems } from "../../../lib/adminApi";
import type { VerifiedItem } from "../../../types";

export default function VerifiedPage() {
  const [items, setItems] = useState<VerifiedItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "LOST" | "FOUND">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      setError("");

      try {
        const verifiedItems = await getVerifiedItems();
        setItems(verifiedItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load verified items.");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const q = search.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.submittedBy.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [items, search, statusFilter]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Verified Items</h2>
        <p className="text-sm text-silver/60">{items.length} approved items on the platform</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by title, location or user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-onyx px-4 py-2.5 text-sm text-white placeholder-silver/40 transition focus:border-cyan focus:outline-none"
        />
        <div className="flex gap-2">
          {(["all", "LOST", "FOUND"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === s
                  ? "bg-cyan/15 text-cyan"
                  : "border border-white/10 bg-white/5 text-silver/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-silver/60">
          Loading verified items...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-silver/60">
          No verified items match your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <VerifiedItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
