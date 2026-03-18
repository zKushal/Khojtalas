export default function HomeScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const quickFilters = ["All", "Nearby", "Recent", "Urgent", "Electronics", "Documents", "Pets"];

  return (
    <div className="min-h-screen bg-obsidian px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">What are you looking for today?</h2>
          <p className="mt-2 text-sm text-silver/80">Help reunite lost items with their owners</p>
        </div>

        <div className="mb-8 flex gap-3">
          <button
            onClick={() => onNavigate("feed")}
            className="flex-1 rounded-2xl border-2 border-magenta bg-magenta/10 px-4 py-4 font-semibold text-magenta transition hover:bg-magenta/20"
          >
            🔍 Lost Something
          </button>
          <button
            onClick={() => onNavigate("feed")}
            className="flex-1 rounded-2xl border-2 border-cyan bg-cyan/10 px-4 py-4 font-semibold text-cyan transition hover:bg-cyan/20"
          >
            ✨ Found Something
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search lost items, locations, categories..."
            className="w-full rounded-2xl border border-white/10 bg-onyx px-4 py-3 text-white placeholder-silver/50 focus:border-cyan focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase text-silver/80">Quick Filters</p>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-cyan/30 bg-cyan/5 p-4 text-sm text-cyan/90">
          <p className="font-semibold">📍 Showing results near your location</p>
          <p className="mt-1 text-xs text-cyan/70">Enable location for better matches</p>
        </div>

        <div className="mt-6 rounded-2xl border border-magenta/30 bg-magenta/5 p-4">
          <p className="text-sm font-semibold text-magenta">🔴 Urgent Cases Near You</p>
          <p className="mt-1 text-xs text-magenta/70">3 items reported lost in the last 24 hours</p>
        </div>
      </div>
    </div>
  );
}
