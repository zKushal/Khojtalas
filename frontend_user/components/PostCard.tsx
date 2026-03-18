import type { ReactNode } from "react";

export type FeedPost = {
  id: string;
  type: "image" | "video";
  mediaUrl: string;
  title: string;
  description: string;
  hashtags: string[];
  username: string;
  location: string;
  likeCount: string;
  commentCount: string;
  shareCount: string;
};

type PostCardProps = {
  post: FeedPost;
};

type ActionButtonProps = {
  label: string;
  value?: string;
  icon: ReactNode;
  emphasized?: boolean;
};

function ActionButton({ label, value, icon, emphasized = false }: ActionButtonProps) {
  return (
    <button
      className={[
        "flex w-full flex-col items-center gap-1 rounded-2xl border border-white/10 px-3 py-3 text-white transition",
        emphasized
          ? "bg-gradient-to-br from-cyan/90 to-magenta/90 shadow-[0_12px_28px_rgba(255,0,80,0.28)]"
          : "bg-white/10 backdrop-blur-xl hover:bg-white/15",
      ].join(" ")}
      aria-label={label}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
      {value ? <span className="text-[10px] text-white/75">{value}</span> : null}
    </button>
  );
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <section className="relative h-screen snap-start overflow-hidden bg-obsidian text-white">
      <div className="absolute inset-0">
        {post.type === "video" ? (
          <video
            src={post.mediaUrl}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img src={post.mediaUrl} alt={post.title} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,0,80,0.12),transparent_32%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md items-end justify-between gap-4 px-4 pb-28 pt-24">
        <div className="max-w-[70%]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan" />
            Lost item alert
          </div>

          <h2 className="text-2xl font-bold leading-tight">{post.title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/85">{post.description}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-cyan">
            {post.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-black/25 px-2.5 py-1 backdrop-blur-sm">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
                @{post.username}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
              <span>{post.location}</span>
            </div>
          </div>
        </div>

        <div className="mb-3 w-[88px] rounded-[28px] border border-white/10 bg-white/10 p-2 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="flex flex-col gap-2">
            <ActionButton
              label="Like"
              value={post.likeCount}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 21s-6.7-4.35-9.1-8.08A5.37 5.37 0 0 1 7.4 4.4c1.84 0 3.32.85 4.6 2.52 1.28-1.67 2.76-2.52 4.6-2.52a5.37 5.37 0 0 1 4.5 8.52C18.7 16.65 12 21 12 21Z" />
                </svg>
              }
            />
            <ActionButton
              label="Comment"
              value={post.commentCount}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6.5h16v10H8l-4 4v-14Z" />
                </svg>
              }
            />
            <ActionButton
              label="Share"
              value={post.shareCount}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 5h5v5" />
                  <path d="M10 14 19 5" />
                  <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
                </svg>
              }
            />
            <ActionButton
              label="Report Found"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              }
              emphasized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
