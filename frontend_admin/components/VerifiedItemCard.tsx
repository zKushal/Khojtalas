import type { VerifiedItem } from "../types";

interface VerifiedItemCardProps {
  item: VerifiedItem;
}

export default function VerifiedItemCard({ item }: VerifiedItemCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      {/* Media */}
      <div className="relative h-36 overflow-hidden bg-onyx">
        {item.mediaUrl ? item.mediaType === "video" ? (
          <video src={item.mediaUrl} className="h-full w-full object-cover" muted playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-silver/45">
            No media uploaded
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            item.status === "LOST" ? "bg-magenta/90 text-white" : "bg-cyan/90 text-black"
          }`}
        >
          {item.status}
        </span>
        {/* Verified badge */}
        <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          ✔ Verified
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-silver">
            {item.category}
          </span>
        </div>
        <div className="space-y-1 text-xs text-silver/70">
          <p>📍 {item.location}</p>
          <p>👤 @{item.submittedBy}</p>
          <p>
            ✔ Approved:{" "}
            <span className="text-cyan/80">
              {item.approvedAt
                ? new Date(item.approvedAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Pending timestamp"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
