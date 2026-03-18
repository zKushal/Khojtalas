"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import MainNavigation from "../components/MainNavigation";
import ItemFeed from "../components/ItemFeed";
import type { LostFoundItem } from "../components/ItemCard";
import ReportFlow, { type ReportFlowData } from "../components/ReportFlow";
import SplashScreen from "../components/SplashScreen";
import { useAuth } from "../context/AuthContext";
import api, { buildMediaUrl, getApiErrorMessage } from "../lib/api";

type ApiFeedItem = {
  id: string;
  status: "LOST" | "FOUND";
  mediaType?: "image" | "video";
  mediaUrl?: string;
  title: string;
  description?: string;
  tags?: string[];
  reportedBy?: string;
  location?: string;
  timeAgo?: string;
  helpfulCount?: string;
  detailsCount?: string;
  shareCount?: string;
  verificationStatus?: "under-review" | "verified";
  userTrustLevel?: "new" | "verified" | "trusted";
  authenticityDetail?: string;
};

type ViewMode = "mobile" | "desktop";
type DesktopSection = "dashboard" | "browse-items" | "ai-matches";

type AiMatchItem = {
  id: string;
  similarityScore: number;
  isResolved: boolean;
  feedbackStatus: "pending" | "recovered" | "incorrect";
  createdAt?: string;
  lostItem?: LostFoundItem;
  foundItem?: LostFoundItem;
};

function mapApiFeedItem(item: ApiFeedItem): LostFoundItem {
  return {
    id: String(item.id),
    status: item.status,
    mediaType: item.mediaType === "video" ? "video" : "image",
    mediaUrl: buildMediaUrl(item.mediaUrl || ""),
    title: item.title,
    description: item.description || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    reportedBy: item.reportedBy || "unknown",
    location: item.location || "Unknown location",
    timeAgo: item.timeAgo || "Just now",
    helpfulCount: item.helpfulCount || "0",
    detailsCount: item.detailsCount || "0",
    shareCount: item.shareCount || "0",
    verificationStatus: item.verificationStatus || "under-review",
    userTrustLevel: item.userTrustLevel || "new",
    authenticityDetail: item.authenticityDetail,
  };
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showReportFlow, setShowReportFlow] = useState(false);
  const [feedItems, setFeedItems] = useState<LostFoundItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [aiMatches, setAiMatches] = useState<AiMatchItem[]>([]);
  const [loadingAiMatches, setLoadingAiMatches] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("mobile");
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("dashboard");

  useEffect(() => {
    const savedMode = window.localStorage.getItem("kt_view_mode") as ViewMode | null;
    if (savedMode === "mobile" || savedMode === "desktop") {
      setViewMode(savedMode);
      return;
    }

    setViewMode(window.innerWidth >= 1024 ? "desktop" : "mobile");
  }, []);

  const handleSwitchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem("kt_view_mode", mode);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openReport") !== "1") return;

    if (isAuthenticated || localStorage.getItem("kt_user_token")) {
      setShowReportFlow(true);
    }
    router.replace("/");
  }, [isAuthenticated, router]);

  const handleReportSubmit = async (data: ReportFlowData) => {
    try {
      const formData = new FormData();
      formData.append("itemType", data.itemType || "lost");
      formData.append("title", data.title);
      formData.append("category", data.category);
      formData.append("location", data.location);
      formData.append("dateTime", data.dateTime);
      formData.append("description", data.description);
      formData.append("authenticityDetail", data.authenticityDetail);
      formData.append("tags", data.category.toLowerCase());

      if (data.image) formData.append("image", data.image);
      if (data.video) formData.append("video", data.video);

      await api.post("/user/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchFeedItems();

      alert("✓ Item reported successfully! It's now under review.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to submit report."));
      throw error;
    }
  };

  const handleReportClick = () => {
    if (!isAuthenticated && !localStorage.getItem("kt_user_token")) {
      router.push("/signup?next=%2F&intent=report");
      return;
    }
    setShowReportFlow(true);
  };

  const handleProfileClick = () => {
    if (!isAuthenticated && !localStorage.getItem("kt_user_token")) {
      router.push("/login?next=%2F&intent=profile");
      return;
    }
    router.push("/profile");
  };

  const fetchFeedItems = async () => {
    try {
      const publicItemsPromise = api.get("/user/items");
      const token = typeof window !== "undefined" ? localStorage.getItem("kt_user_token") : null;
      const myItemsPromise = token ? api.get("/user/my-items") : Promise.resolve({ data: { items: [] } });

      const [publicResponse, myResponse] = await Promise.all([publicItemsPromise, myItemsPromise]);

      const publicItems = Array.isArray(publicResponse?.data?.items) ? publicResponse.data.items : [];
      const myItems = Array.isArray(myResponse?.data?.items) ? myResponse.data.items : [];

      const mergedMap = new Map<string, ApiFeedItem>();

      for (const item of [...myItems, ...publicItems]) {
        mergedMap.set(String(item.id), item as ApiFeedItem);
      }

      const normalized = Array.from(mergedMap.values()).map(mapApiFeedItem);
      setFeedItems(normalized);
    } catch {
      setFeedItems([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchAiMatches = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kt_user_token") : null;
      if (!token) {
        setAiMatches([]);
        return;
      }

      setLoadingAiMatches(true);
      const response = await api.get("/user/matches");
      const rawMatches = Array.isArray(response?.data?.matches) ? response.data.matches : [];

      const normalizedMatches: AiMatchItem[] = rawMatches.map((match: any) => ({
        id: String(match.id),
        similarityScore: Number(match.similarityScore || 0),
        isResolved: Boolean(match.is_resolved),
        feedbackStatus: (match.feedbackStatus || "pending") as "pending" | "recovered" | "incorrect",
        createdAt: match.createdAt || match.created_at,
        lostItem: match.lostItem ? mapApiFeedItem(match.lostItem) : undefined,
        foundItem: match.foundItem ? mapApiFeedItem(match.foundItem) : undefined,
      }));

      setAiMatches(normalizedMatches);
    } catch {
      setAiMatches([]);
    } finally {
      setLoadingAiMatches(false);
    }
  };

  const handleMarkRecovered = async (matchId: string) => {
    try {
      await api.patch(`/user/matches/${matchId}/recover`);
      setAiMatches((current) =>
        current.map((m) => (m.id === matchId ? { ...m, isResolved: true, feedbackStatus: "recovered" } : m)),
      );
      alert("Match marked as recovered.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to mark match as recovered."));
    }
  };

  const handleReportIncorrectMatch = async (matchId: string) => {
    try {
      await api.patch(`/user/matches/${matchId}/incorrect`);
      setAiMatches((current) =>
        current.map((m) => (m.id === matchId ? { ...m, feedbackStatus: "incorrect" } : m)),
      );
      alert("Match has been flagged as incorrect.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to report incorrect match."));
    }
  };

  const handleContactFinder = (match: AiMatchItem) => {
    const finderName = match.foundItem?.reportedBy || "finder";
    const location = match.foundItem?.location || "the reported location";
    alert(`Contact request sent to ${finderName}. Last seen at ${location}.`);
  };

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoadingFeed(true);
      await fetchFeedItems();
    };

    load();

    const intervalId = window.setInterval(async () => {
      if (!isActive) return;
      await fetchFeedItems();
    }, 6000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let isActive = true;

    const loadMatches = async () => {
      if (!isActive) return;
      await fetchAiMatches();
    };

    loadMatches();

    const intervalId = window.setInterval(async () => {
      if (!isActive) return;
      await fetchAiMatches();
    }, 8000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const totalLostItems = useMemo(
    () => feedItems.filter((item) => item.status === "LOST").length,
    [feedItems],
  );

  const totalFoundItems = useMemo(
    () => feedItems.filter((item) => item.status === "FOUND").length,
    [feedItems],
  );

  const aiMatchesDetected = useMemo(
    () => Math.min(totalLostItems, totalFoundItems),
    [totalFoundItems, totalLostItems],
  );

  const recoveredItems = useMemo(
    () => Math.floor(aiMatchesDetected * 0.8),
    [aiMatchesDetected],
  );

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of feedItems) {
      const rawCategory = item.tags?.[0] || "Other";
      const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [feedItems]);

  const recentActivity = useMemo(() => {
    return feedItems.slice(0, 6).map((item) => ({
      id: item.id,
      text:
        item.status === "FOUND"
          ? `${item.title} found near ${item.location}`
          : `${item.title} reported lost near ${item.location}`,
      time: item.timeAgo,
      status: item.status,
    }));
  }, [feedItems]);

  if (showSplash) return <SplashScreen />;

  return (
    <main className="relative min-h-screen bg-obsidian text-white">
      <div className="fixed right-3 top-3 z-[70] flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-onyx/90 p-1 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleSwitchViewMode("mobile")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              viewMode === "mobile"
                ? "bg-cyan text-obsidian"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Mobile View
          </button>
          <button
            type="button"
            onClick={() => handleSwitchViewMode("desktop")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              viewMode === "desktop"
                ? "bg-magenta text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Desktop View
          </button>
        </div>
      </div>

      {viewMode === "mobile" ? (
        <>
          <div className="pb-32">
            <Header />
            <div className="pt-16">
              <ItemFeed
                items={feedItems}
                isLoading={loadingFeed}
                emptyMessage="No feeds currently"
                onReportSuspicious={() => alert("Thank you for reporting. Our team will review this.")}
              />
            </div>
          </div>
          <MainNavigation onReportClick={handleReportClick} onProfileClick={handleProfileClick} />
        </>
      ) : (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(0,242,234,0.2),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(255,0,80,0.16),_transparent_48%),#090b12] pb-10 pt-16">
          <aside className="hidden h-[calc(100vh-4.5rem)] w-64 flex-col border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur-xl md:fixed md:left-4 md:top-16 md:flex md:rounded-3xl">
            <h1 className="px-3 text-lg font-bold tracking-tight text-white">KhojTalas</h1>
            <p className="px-3 pt-1 text-xs text-silver/80">AI Lost & Found Command Center</p>
            <nav className="mt-6 space-y-2">
              {[
                "Dashboard",
                "Report Lost Item",
                "Report Found Item",
                "Browse Items",
                "AI Matches",
                "Map",
                "Notifications",
                "Profile",
                "Settings",
              ].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (label === "Report Lost Item" || label === "Report Found Item") {
                      handleReportClick();
                      return;
                    }

                    if (label === "Browse Items") {
                      setDesktopSection("browse-items");
                      return;
                    }

                    if (label === "AI Matches") {
                      setDesktopSection("ai-matches");
                      return;
                    }

                    if (label === "Dashboard") {
                      setDesktopSection("dashboard");
                      return;
                    }

                    if (label === "Profile") {
                      handleProfileClick();
                    }
                  }}
                  className={`flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm transition ${
                    (label === "Dashboard" && desktopSection === "dashboard") ||
                    (label === "Browse Items" && desktopSection === "browse-items") ||
                    (label === "AI Matches" && desktopSection === "ai-matches")
                      ? "bg-cyan/20 text-cyan"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:pl-80 md:pr-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  {desktopSection === "dashboard"
                    ? "Find My Item Dashboard"
                    : desktopSection === "browse-items"
                      ? "Browse All Entered Items"
                      : "AI Match Center"}
                </h2>
                <p className="text-sm text-silver/80">
                  {desktopSection === "dashboard"
                    ? "Real-time visibility for lost and found reporting with AI matching."
                    : desktopSection === "browse-items"
                      ? "Showing every reported lost and found item in the system feed."
                      : "Review AI-detected lost and found matches and take action."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-obsidian transition hover:opacity-90"
                >
                  Report Lost Item
                </button>
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="rounded-xl bg-magenta px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Report Found Item
                </button>
              </div>
            </div>

            {desktopSection === "dashboard" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total Lost Items", value: totalLostItems, tone: "border-cyan/30" },
                    { label: "Total Found Items", value: totalFoundItems, tone: "border-magenta/30" },
                    { label: "AI Matches Detected", value: aiMatchesDetected, tone: "border-emerald-400/30" },
                    { label: "Items Recovered", value: recoveredItems, tone: "border-amber-300/30" },
                  ].map((card) => (
                    <article key={card.label} className={`rounded-2xl border bg-white/5 p-4 backdrop-blur-xl ${card.tone}`}>
                      <p className="text-sm text-silver/80">{card.label}</p>
                      <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr,1fr]">
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <h3 className="text-base font-semibold text-white">Items Lost by Category</h3>
                    <div className="mt-4 space-y-3">
                      {(categoryBreakdown.length ? categoryBreakdown : [{ name: "No Data", value: 0 }]).map((entry) => (
                        <div key={entry.name}>
                          <div className="mb-1 flex justify-between text-xs text-silver/80">
                            <span>{entry.name}</span>
                            <span>{entry.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-cyan to-magenta"
                              style={{ width: `${Math.max(6, Math.min(100, entry.value * 12))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <h3 className="text-base font-semibold text-white">Live Activity Feed</h3>
                    <div className="mt-4 space-y-3">
                      {(recentActivity.length ? recentActivity : [{ id: "none", text: "No live events yet", time: "", status: "LOST" as const }]).map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-sm text-white">{activity.text}</p>
                          <p className="mt-1 text-xs text-silver/70">{activity.time || "Waiting for new reports..."}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr,1fr]">
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white">AI Match Center</h3>
                      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-300">{"\u226595% Auto Notify"}</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {aiMatchesDetected > 0 ? (
                        Array.from({ length: Math.min(3, aiMatchesDetected) }).map((_, idx) => (
                          <div key={idx} className="rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-3">
                            <p className="text-sm text-white">Potential match #{idx + 1}</p>
                            <p className="mt-1 text-xs text-emerald-200">{95 + idx}% similarity detected</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-obsidian">Contact Finder</button>
                              <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Mark Recovered</button>
                              <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Report Incorrect</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-silver/75">No high-confidence matches detected yet.</p>
                      )}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <h3 className="text-base font-semibold text-white">Interactive Map Tracking</h3>
                    <div className="mt-4 rounded-xl border border-dashed border-cyan/40 bg-cyan/5 p-4">
                      <p className="text-sm text-cyan/90">Map integration placeholder for clustered lost/found markers.</p>
                      <p className="mt-2 text-xs text-cyan/75">Connect Mapbox or Google Maps API to render transport routes and radius filters.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/explore")}
                      className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Open Full Map & Explore
                    </button>
                  </article>
                </div>
              </>
            ) : desktopSection === "browse-items" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                {loadingFeed ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-silver/80">Loading all entered items...</div>
                ) : feedItems.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-silver/80">No items have been entered yet.</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {feedItems.map((item) => (
                      <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        <div className="relative h-44 w-full bg-black/30">
                          {item.mediaUrl ? (
                            item.mediaType === "video" ? (
                              <video className="h-full w-full object-cover" src={item.mediaUrl} muted playsInline />
                            ) : (
                              <img className="h-full w-full object-cover" src={item.mediaUrl} alt={item.title} />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-silver/70">No media</div>
                          )}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                item.status === "FOUND" ? "bg-cyan/20 text-cyan" : "bg-magenta/20 text-magenta"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-silver/80">{item.description || "No description provided."}</p>
                          <p className="text-xs text-silver/70">{item.location}</p>
                          <p className="text-xs text-silver/60">{item.timeAgo}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                {loadingAiMatches ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-silver/80">Loading AI matches...</div>
                ) : aiMatches.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-silver/80">No AI matches found yet.</div>
                ) : (
                  aiMatches.map((match) => (
                    <article key={match.id} className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">Match #{match.id}</p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-semibold text-emerald-200">
                            {Math.round(match.similarityScore)}% similarity
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              match.feedbackStatus === "recovered"
                                ? "bg-cyan/20 text-cyan"
                                : match.feedbackStatus === "incorrect"
                                  ? "bg-magenta/20 text-magenta"
                                  : "bg-white/10 text-white"
                            }`}
                          >
                            {match.feedbackStatus}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-xs font-semibold text-magenta">Lost Item</p>
                          <p className="mt-1 text-sm text-white">{match.lostItem?.title || "Unknown lost item"}</p>
                          <p className="mt-1 text-xs text-silver/80">{match.lostItem?.location || "Unknown location"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-xs font-semibold text-cyan">Found Item</p>
                          <p className="mt-1 text-sm text-white">{match.foundItem?.title || "Unknown found item"}</p>
                          <p className="mt-1 text-xs text-silver/80">{match.foundItem?.location || "Unknown location"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleContactFinder(match)}
                          className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-obsidian"
                        >
                          Contact finder
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkRecovered(match.id)}
                          disabled={match.feedbackStatus === "recovered"}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Mark recovered
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportIncorrectMatch(match.id)}
                          disabled={match.feedbackStatus === "incorrect"}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Report incorrect match
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <ReportFlow
        isOpen={showReportFlow}
        onClose={() => setShowReportFlow(false)}
        onSubmit={handleReportSubmit}
      />
    </main>
  );
}
