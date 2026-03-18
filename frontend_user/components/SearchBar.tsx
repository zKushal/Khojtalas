type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-silver backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] uppercase tracking-[0.22em] text-silver/60">KhojTalas Explore</p>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search lost/found items..."
            className="w-full bg-transparent text-sm text-white placeholder:text-silver/70 focus:outline-none"
            aria-label="Search lost and found items"
          />
        </div>
        <span className="rounded-full border border-cyan/20 bg-cyan/10 px-2 py-1 text-[10px] font-semibold text-cyan">
          Live
        </span>
      </div>
    </div>
  );
}
