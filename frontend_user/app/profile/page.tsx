"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import MainNavigation from "../../components/MainNavigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import api, { buildMediaUrl, getApiErrorMessage } from "../../lib/api";

type MyPost = {
  id: string;
  status: "LOST" | "FOUND";
  title: string;
  description: string;
  location: string;
  timeAgo: string;
  verificationStatus: "under-review" | "verified";
  mediaType: "image" | "video";
  mediaUrl: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMyPosts = async () => {
      if (!isMounted) return;
      setPostsError("");

      try {
        const response = await api.get("/user/my-items");
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];

        if (!isMounted) return;

        const normalized: MyPost[] = items.map((item: Record<string, unknown>) => ({
          id: String(item.id || ""),
          status: item.status === "FOUND" ? "FOUND" : "LOST",
          title: String(item.title || "Untitled"),
          description: String(item.description || ""),
          location: String(item.location || "Unknown location"),
          timeAgo: String(item.timeAgo || "Just now"),
          verificationStatus: item.verificationStatus === "verified" ? "verified" : "under-review",
          mediaType: item.mediaType === "video" ? "video" : "image",
          mediaUrl: buildMediaUrl(String(item.mediaUrl || "")),
        }));

        setMyPosts(normalized);
      } catch (error) {
        if (!isMounted) return;
        setPostsError(getApiErrorMessage(error, "Failed to load your posts."));
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    };

    loadMyPosts();

    const intervalId = window.setInterval(loadMyPosts, 7000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const lostPosts = useMemo(
    () => myPosts.filter((post) => post.status === "LOST"),
    [myPosts]
  );

  const foundPosts = useMemo(
    () => myPosts.filter((post) => post.status === "FOUND"),
    [myPosts]
  );

  return (
    <ProtectedRoute>
      <main className="hide-scrollbar h-screen overflow-y-auto bg-obsidian pb-[calc(10rem+env(safe-area-inset-bottom))] text-white">
        <Header />
        <section className="mx-auto max-w-md px-4 pb-8 pt-20">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan/70">Profile</p>
            <h1 className="mt-1 text-xl font-bold">{user?.fullName || "KhojTalas User"}</h1>
            <p className="mt-1 text-xs text-silver/75">{user?.email}</p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="rounded-2xl border border-white/10 bg-onyx px-3 py-2.5">
                <span className="text-silver/70">Role:</span> <span className="ml-2 font-semibold">{user?.role}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-onyx px-3 py-2.5">
                <span className="text-silver/70">Trust level:</span> <span className="ml-2 font-semibold">{user?.trustLevel || "new"}</span>
              </div>
              {user?.createdAt ? (
                <div className="rounded-2xl border border-white/10 bg-onyx px-3 py-2.5">
                  <span className="text-silver/70">Joined:</span> <span className="ml-2 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ) : null}
            </div>

            <button
              onClick={() => {
                logout();
                router.replace("/");
              }}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan to-magenta px-4 py-2.5 text-sm font-bold text-black"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-cyan">Lost ({lostPosts.length})</h2>
                <span className="text-[11px] text-silver/60">Your reported lost items</span>
              </div>

              {loadingPosts ? (
                <p className="text-xs text-silver/70">Loading your posts...</p>
              ) : postsError ? (
                <p className="text-xs text-magenta">{postsError}</p>
              ) : lostPosts.length === 0 ? (
                <p className="text-xs text-silver/70">No lost posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {lostPosts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-white/10 bg-onyx p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-magenta/15 px-2 py-0.5 text-[10px] font-semibold text-magenta">
                          LOST
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${post.verificationStatus === "verified" ? "bg-cyan/15 text-cyan" : "bg-white/10 text-silver/80"}`}>
                          {post.verificationStatus === "verified" ? "Verified" : "Under Review"}
                        </span>
                      </div>

                      {post.mediaUrl ? (
                        post.mediaType === "video" ? (
                          <video src={post.mediaUrl} className="mb-2 h-32 w-full rounded-xl object-cover" muted playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.mediaUrl} alt={post.title} className="mb-2 h-32 w-full rounded-xl object-cover" />
                        )
                      ) : null}

                      <h3 className="text-sm font-semibold text-white">{post.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-silver/75">{post.description || "No description"}</p>
                      <p className="mt-2 text-[11px] text-silver/70">📍 {post.location}</p>
                      <p className="text-[11px] text-silver/55">🕐 {post.timeAgo}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-cyan">Found ({foundPosts.length})</h2>
                <span className="text-[11px] text-silver/60">Your reported found items</span>
              </div>

              {loadingPosts ? (
                <p className="text-xs text-silver/70">Loading your posts...</p>
              ) : postsError ? (
                <p className="text-xs text-magenta">{postsError}</p>
              ) : foundPosts.length === 0 ? (
                <p className="text-xs text-silver/70">No found posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {foundPosts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-white/10 bg-onyx p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                          FOUND
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${post.verificationStatus === "verified" ? "bg-cyan/15 text-cyan" : "bg-white/10 text-silver/80"}`}>
                          {post.verificationStatus === "verified" ? "Verified" : "Under Review"}
                        </span>
                      </div>

                      {post.mediaUrl ? (
                        post.mediaType === "video" ? (
                          <video src={post.mediaUrl} className="mb-2 h-32 w-full rounded-xl object-cover" muted playsInline />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.mediaUrl} alt={post.title} className="mb-2 h-32 w-full rounded-xl object-cover" />
                        )
                      ) : null}

                      <h3 className="text-sm font-semibold text-white">{post.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-silver/75">{post.description || "No description"}</p>
                      <p className="mt-2 text-[11px] text-silver/70">📍 {post.location}</p>
                      <p className="text-[11px] text-silver/55">🕐 {post.timeAgo}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <MainNavigation onProfileClick={() => {}} />
      </main>
    </ProtectedRoute>
  );
}
