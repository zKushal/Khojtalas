import type { LostFoundItem } from "./ItemCard";

type ExploreItem = LostFoundItem & {
  category: "Electronics" | "Documents" | "Pets" | "Urgent" | "Other";
  scope: "nearby" | "global";
};

type MapViewProps = {
  items: ExploreItem[];
  onPick: (item: ExploreItem) => void;
};

export default function MapView({ items, onPick }: MapViewProps) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.15),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,0,80,0.2),transparent_45%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative z-10 h-full p-4">
        <div className="mb-3 text-xs text-silver/80">Map View (demo pins)</div>
        <div className="grid h-[calc(100%-24px)] grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              className="rounded-2xl border border-white/10 bg-onyx/70 px-3 py-2 text-left transition hover:border-cyan/40 hover:bg-onyx"
            >
              <div className="mb-1 flex items-center gap-1 text-[10px]">
                <span className={item.status === "LOST" ? "text-magenta" : "text-cyan"}>{item.status}</span>
                {item.verificationStatus === "verified" ? <span className="text-cyan">✔</span> : null}
              </div>
              <p className="line-clamp-1 text-xs font-semibold text-white">{item.title}</p>
              <p className="line-clamp-1 text-[11px] text-silver/80">{item.location}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
