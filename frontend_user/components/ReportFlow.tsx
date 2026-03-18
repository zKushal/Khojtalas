import { useState } from "react";

export type ReportFlowData = {
  step: 1 | 2 | 3;
  itemType: "lost" | "found" | null;
  title: string;
  category: string;
  location: string;
  dateTime: string;
  description: string;
  image: File | null;
  video: File | null;
  authenticityDetail: string;
};

type ReportFlowProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFlowData) => void;
};

const categories = ["Electronics", "Documents", "Jewelry", "Pets", "Clothing", "Bags", "Keys", "Other"];

export default function ReportFlow({ isOpen, onClose, onSubmit }: ReportFlowProps) {
  const [data, setData] = useState<ReportFlowData>({
    step: 1,
    itemType: null,
    title: "",
    category: "",
    location: "",
    dateTime: "",
    description: "",
    image: null,
    video: null,
    authenticityDetail: "",
  });

  const handleStep1Next = () => {
    if (data.itemType && data.title && data.category && data.location && data.dateTime) {
      setData({ ...data, step: 2 });
    }
  };

  const step2CanProceed =
    data.itemType === "found"
      ? data.image !== null && data.video !== null
      : true;

  const handleStep2Next = () => {
    if (step2CanProceed) setData({ ...data, step: 3 });
  };

  const handleSubmit = () => {
    if (data.authenticityDetail) {
      onSubmit(data);
      setData({
        step: 1,
        itemType: null,
        title: "",
        category: "",
        location: "",
        dateTime: "",
        description: "",
        image: null,
        video: null,
        authenticityDetail: "",
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
      <div className="w-full rounded-t-3xl border border-white/10 bg-obsidian p-6 text-white">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Report Item</h2>
            <button
              onClick={onClose}
              className="text-white/60 transition hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full ${data.step >= step ? "bg-cyan" : "bg-white/10"}`}
              />
            ))}
          </div>

          {data.step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setData({ ...data, itemType: "lost" })}
                  className={`flex-1 rounded-xl border-2 px-4 py-2 font-semibold transition ${
                    data.itemType === "lost"
                      ? "border-magenta bg-magenta/15 text-magenta"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  }`}
                >
                  Lost Item
                </button>
                <button
                  onClick={() => setData({ ...data, itemType: "found" })}
                  className={`flex-1 rounded-xl border-2 px-4 py-2 font-semibold transition ${
                    data.itemType === "found"
                      ? "border-cyan bg-cyan/15 text-cyan"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  }`}
                >
                  Found Item
                </button>
              </div>

              <input
                type="text"
                placeholder="Item title"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
              />

              <select
                value={data.category}
                onChange={(e) => setData({ ...data, category: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white focus:border-cyan focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Location"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
              />

              <input
                type="datetime-local"
                value={data.dateTime}
                onChange={(e) => setData({ ...data, dateTime: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white focus:border-cyan focus:outline-none"
              />

              <textarea
                placeholder="Description"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                rows={3}
              />

              <button
                onClick={handleStep1Next}
                disabled={!data.itemType || !data.title || !data.category || !data.location || !data.dateTime}
                className="w-full rounded-xl bg-gradient-to-r from-cyan to-magenta px-4 py-3 font-semibold text-black transition disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {data.step === 2 && (
            <div className="space-y-4">
              {data.itemType === "found" ? (
                <div className="rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-xs text-cyan/80">
                  📷 Image <span className="text-magenta font-semibold">(required)</span> + 🎥 Video{" "}
                  <span className="text-magenta font-semibold">(required)</span> — both needed to verify found items.
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                  📷 Image is optional for Lost items. Add one if available.
                </div>
              )}

              <div>
                <p className="mb-1 text-xs font-semibold text-white/70">
                  Image{data.itemType === "found" ? " " : " "}
                  <span className={data.itemType === "found" ? "text-magenta" : "text-silver"}>
                    {data.itemType === "found" ? "(Required)" : "(Optional)"}
                  </span>
                </p>
                <div
                  className={`rounded-xl border-2 border-dashed p-5 ${
                    data.itemType === "found" && !data.image ? "border-magenta/50" : "border-white/20"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData({ ...data, image: e.target.files?.[0] || null })}
                    className="w-full text-sm text-white/70"
                  />
                  {data.image && <p className="mt-2 text-sm text-cyan">✓ {data.image.name}</p>}
                </div>
                {data.itemType === "found" && !data.image && (
                  <p className="mt-1 text-xs text-magenta">⚠ Image is required for found items.</p>
                )}
              </div>

              {data.itemType === "found" && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-white/70">
                    Video <span className="text-magenta">(Required)</span>
                  </p>
                  <div
                    className={`rounded-xl border-2 border-dashed p-5 ${
                      !data.video ? "border-magenta/50" : "border-white/20"
                    }`}
                  >
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setData({ ...data, video: e.target.files?.[0] || null })}
                      className="w-full text-sm text-white/70"
                    />
                    {data.video && <p className="mt-2 text-sm text-cyan">✓ {data.video.name}</p>}
                  </div>
                  {!data.video && (
                    <p className="mt-1 text-xs text-magenta">⚠ Video proof is required for found items.</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setData({ ...data, step: 1 })}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Next}
                  disabled={!step2CanProceed}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan to-magenta px-4 py-2 font-semibold text-black disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {data.step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Add a unique detail only the owner can verify (prevents fraud)
              </p>

              <textarea
                placeholder="E.g., 'Has a small scratch on the bottom' or 'Serial number is 12345'..."
                value={data.authenticityDetail}
                onChange={(e) => setData({ ...data, authenticityDetail: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-2 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                rows={4}
              />

              <div className="rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-xs text-cyan/90">
                This detail will be kept private and only shown to verify the true owner.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setData({ ...data, step: 2 })}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!data.authenticityDetail}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan to-magenta px-4 py-2 font-semibold text-black disabled:opacity-50"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
