export type ExploreCategory = "All" | "Electronics" | "Documents" | "Pets" | "Urgent";
export type ExploreStatus = "ALL" | "LOST" | "FOUND";
export type ExploreScope = "nearby" | "global";

export type ExploreFilters = {
  category: ExploreCategory;
  status: ExploreStatus;
  scope: ExploreScope;
  verifiedOnly: boolean;
};

type FilterPanelProps = {
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
};

const categories: ExploreCategory[] = ["All", "Electronics", "Documents", "Pets", "Urgent"];
const statuses: ExploreStatus[] = ["ALL", "LOST", "FOUND"];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 p-3 shadow-[0_14px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
      {/* Row 1: Categories */}
      <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange({ ...filters, category })}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filters.category === category
                ? "bg-cyan/20 text-cyan shadow-[0_0_24px_rgba(0,242,234,0.16)]"
                : "bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Row 2: Status, Scope, Verified Only */}
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onChange({ ...filters, status })}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filters.status === status
                ? status === "LOST"
                  ? "bg-magenta/20 text-magenta shadow-[0_0_24px_rgba(255,0,80,0.14)]"
                  : "bg-cyan/20 text-cyan shadow-[0_0_24px_rgba(0,242,234,0.16)]"
                : "bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            {status}
          </button>
        ))}

        <button
          onClick={() => onChange({ ...filters, scope: filters.scope === "nearby" ? "global" : "nearby" })}
          className="shrink-0 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
        >
          {filters.scope === "nearby" ? "Nearby" : "Global"}
        </button>

        <button
          onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            filters.verifiedOnly
              ? "bg-cyan/20 text-cyan shadow-[0_0_24px_rgba(0,242,234,0.16)]"
              : "bg-white/5 text-white/75 hover:bg-white/10"
          }`}
        >
          Verified Only {filters.verifiedOnly ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}