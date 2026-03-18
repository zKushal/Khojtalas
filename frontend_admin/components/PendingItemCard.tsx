"use client";

import { useState } from "react";
import type { PendingItem } from "../types";

interface PendingItemCardProps {
  item: PendingItem;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onMarkUrgent: (id: string) => void;
}

export default function PendingItemCard({
  item,
  onApprove,
  onReject,
  onMarkUrgent,
}: PendingItemCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onReject(item.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Media */}
        <div className="relative h-44 overflow-hidden bg-onyx">
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
          {/* Status / urgent badges */}
          <div className="absolute left-2 top-2 flex gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                item.status === "LOST"
                  ? "bg-magenta/90 text-white"
                  : "bg-cyan/90 text-black"
              }`}
            >
              {item.status}
            </span>
            {item.isUrgent && (
              <span className="rounded-full bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                URGENT
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white">{item.title}</h3>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-silver">
              {item.category}
            </span>
          </div>

          <div className="space-y-1 text-xs text-silver/70">
            <p>📍 {item.location}</p>
            <p>👤 @{item.submittedBy}</p>
            <p>🕐 {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Unknown time"}</p>
          </div>

          <p className="mt-2 line-clamp-2 text-xs text-silver/80">{item.description}</p>

          {/* Authenticity detail toggle */}
          <button
            onClick={() => setShowDetail((p) => !p)}
            className="mt-2 text-xs text-cyan/80 underline-offset-2 transition hover:text-cyan hover:underline"
          >
            {showDetail ? "Hide" : "View"} owner-verifiable detail
          </button>
          {showDetail && (
            <div className="mt-1.5 rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs text-cyan/90">
              🔒 {item.authenticityDetail}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onApprove(item.id)}
              className="flex-1 rounded-xl bg-cyan/15 px-3 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/25 active:scale-95"
            >
              ✔ Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 rounded-xl bg-magenta/15 px-3 py-2 text-xs font-semibold text-magenta transition hover:bg-magenta/25 active:scale-95"
            >
              ✕ Reject
            </button>
            {!item.isUrgent && (
              <button
                onClick={() => onMarkUrgent(item.id)}
                title="Mark as Urgent"
                className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs transition hover:bg-yellow-500/20"
              >
                🚨
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-onyx p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-white">Reject Report</h3>
            <p className="mb-4 text-sm text-silver/60">
              Provide a reason — this will be sent to the reporter.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='e.g. "Insufficient proof provided"'
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-obsidian px-4 py-3 text-sm text-white placeholder-silver/40 focus:border-cyan focus:outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-silver/80 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-magenta to-magenta/70 px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
