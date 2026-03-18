"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type DesktopSection = "dashboard" | "browse-items" | "ai-matches" | "settings";

type ThemeMode = "aurora" | "midnight" | "sunrise";

type ThemeTokens = {
  shellBg: string;
  activeNav: string;
  primaryButton: string;
  secondaryButton: string;
  highlightPill: string;
  chartFill: string;
};

type UserSettings = {
  realtimeNotifications: boolean;
  emailNotifications: boolean;
  theme: ThemeMode;
  profileName: string;
  language: "en" | "hi";
  privacyMode: boolean;
};

const USER_SETTINGS_STORAGE_KEY = "kt_user_settings";

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
  const { isAuthenticated, user, logout, refreshProfile } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showReportFlow, setShowReportFlow] = useState(false);
  const [reportItemType, setReportItemType] = useState<"lost" | "found">("lost");
  const [feedItems, setFeedItems] = useState<LostFoundItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [aiMatches, setAiMatches] = useState<AiMatchItem[]>([]);
  const [loadingAiMatches, setLoadingAiMatches] = useState(false);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("dashboard");
  const [settings, setSettings] = useState<UserSettings>({
    realtimeNotifications: true,
    emailNotifications: false,
    theme: "aurora",
    profileName: "",
    language: "en",
    privacyMode: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      setSettings((current) => ({
        ...current,
        ...parsed,
      }));
    } catch {
      // Ignore malformed settings and continue with defaults.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (!user?.fullName) return;
    setSettings((current) => {
      if (current.profileName) return current;
      return { ...current, profileName: user.fullName };
    });
  }, [user?.fullName]);

  const handleSaveProfileName = async () => {
    const nextName = settings.profileName.trim();
    if (nextName.length < 2) {
      alert("Profile name should be at least 2 characters.");
      return;
    }

    try {
      setIsSavingProfile(true);
      await api.patch("/user/profile/update", { fullName: nextName });
      await refreshProfile();
      alert("Profile name updated.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to update profile name."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post("/user/profile/change-password", { currentPassword, newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed. Please log in again.");
      logout();
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to change password."));
    } finally {
      setIsChangingPassword(false);
    }
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
      const isFoundItem = (data.itemType || "lost") === "found";
      const resolvedLocationFrom = isFoundItem ? (data.location || data.locationFrom) : data.locationFrom;
      const resolvedLocationTo = isFoundItem ? (data.location || data.locationTo || data.locationFrom) : data.locationTo;
      const resolvedTimeFrom = isFoundItem ? (data.dateTime || data.timeFrom) : data.timeFrom;
      const resolvedTimeTo = isFoundItem ? (data.dateTime || data.timeTo || data.timeFrom) : data.timeTo;

      const formData = new FormData();
      formData.append("itemType", data.itemType || "lost");
      formData.append("title", data.title);
      formData.append("category", data.category);
      formData.append("locationFrom", resolvedLocationFrom);
      formData.append("locationTo", resolvedLocationTo);
      formData.append("timeFrom", resolvedTimeFrom);
      formData.append("timeTo", resolvedTimeTo);
      formData.append("location", isFoundItem ? resolvedLocationFrom : `${resolvedLocationFrom} -> ${resolvedLocationTo}`);
      formData.append("dateTime", resolvedTimeFrom);
      formData.append(
        "featureData",
        JSON.stringify({
          brand: data.brand,
          model: data.model,
          color: data.color,
          quantity: data.quantity ? Number(data.quantity) : null,
          identifier: data.identifier,
          contactNumber: data.contactNumber,
          rewardOrCondition: data.reward,
          reportKind: data.itemType || "lost",
        }),
      );
      formData.append("description", data.description);
      formData.append("authenticityDetail", data.authenticityDetail);
      formData.append("tags", data.category.toLowerCase());

      if (data.image) formData.append("image", data.image);
      if (data.video) formData.append("video", data.video);

      await api.post("/user/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchFeedItems();

      // Found item submission triggers immediate AI comparison refresh.
      if ((data.itemType || "lost") === "found") {
        await fetchAiMatches();
        setDesktopSection("ai-matches");
      }

      alert("✓ Item reported successfully! It's now under review.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to submit report."));
      throw error;
    }
  };

  const handleReportClick = (itemType: "lost" | "found" = "lost") => {
    if (!isAuthenticated && !localStorage.getItem("kt_user_token")) {
      router.push("/signup?next=%2F&intent=report");
      return;
    }
    setReportItemType(itemType);
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
      const publicResponse = await api.get("/user/items");
      const publicItems = Array.isArray(publicResponse?.data?.items) ? publicResponse.data.items : [];
      const normalized = publicItems.map(mapApiFeedItem);
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
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${protocol}://localhost:5000/ws/notifications/${user.id}/`;
    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (payload?.type === "ai_match_detected") {
          if (settings.realtimeNotifications) {
            setRealtimeNotice(payload.title || "AI match detected");
          }
          fetchAiMatches();
        }
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    socket.onerror = () => {
      // Keep silent on websocket errors so UI remains usable.
    };

    return () => {
      socket.close();
    };
  }, [settings.realtimeNotifications, user?.id]);

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
    }, 6000);

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

  const themeTokens = useMemo<ThemeTokens>(() => {
    if (settings.theme === "midnight") {
      return {
        shellBg:
          "bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(2,6,23,0.9),_transparent_50%),#020617]",
        activeNav: "bg-blue-400/20 text-blue-200",
        primaryButton: "bg-blue-400 text-slate-950 hover:bg-blue-300",
        secondaryButton: "bg-indigo-400 text-slate-950 hover:bg-indigo-300",
        highlightPill: "bg-blue-400/20 text-blue-200",
        chartFill: "bg-gradient-to-r from-blue-400 to-indigo-400",
      };
    }

    if (settings.theme === "sunrise") {
      return {
        shellBg:
          "bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.26),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.18),_transparent_48%),#1a0f0a]",
        activeNav: "bg-amber-300/20 text-amber-200",
        primaryButton: "bg-amber-300 text-amber-950 hover:bg-amber-200",
        secondaryButton: "bg-rose-300 text-rose-950 hover:bg-rose-200",
        highlightPill: "bg-amber-300/20 text-amber-200",
        chartFill: "bg-gradient-to-r from-amber-300 to-rose-300",
      };
    }

    return {
      shellBg:
        "bg-[radial-gradient(circle_at_top_right,_rgba(0,242,234,0.2),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(255,0,80,0.16),_transparent_48%),#090b12]",
      activeNav: "bg-cyan/20 text-cyan",
      primaryButton: "bg-cyan text-obsidian hover:opacity-90",
      secondaryButton: "bg-magenta text-white hover:opacity-90",
      highlightPill: "bg-emerald-400/20 text-emerald-300",
      chartFill: "bg-gradient-to-r from-cyan to-magenta",
    };
  }, [settings.theme]);

  if (showSplash) return <SplashScreen />;

  return (
    <main className="relative min-h-screen bg-obsidian text-white">
      <div className={`min-h-screen pb-10 pt-16 ${themeTokens.shellBg}`}>
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
              "Settings",
            ].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (label === "Report Lost Item" || label === "Report Found Item") {
                    handleReportClick(label === "Report Found Item" ? "found" : "lost");
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

                  if (label === "Settings") {
                    setDesktopSection("settings");
                    return;
                  }

                }}
                className={`flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm transition ${
                  (label === "Dashboard" && desktopSection === "dashboard") ||
                  (label === "Browse Items" && desktopSection === "browse-items") ||
                  (label === "AI Matches" && desktopSection === "ai-matches") ||
                  (label === "Settings" && desktopSection === "settings")
                    ? themeTokens.activeNav
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:pl-80 md:pr-8">
          {realtimeNotice && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              <span>{realtimeNotice}</span>
              <button
                type="button"
                onClick={() => setRealtimeNotice(null)}
                className="rounded-md bg-white/10 px-2 py-1 text-xs text-white"
              >
                Dismiss
              </button>
            </div>
          )}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  {desktopSection === "dashboard"
                    ? "Find My Item Dashboard"
                    : desktopSection === "browse-items"
                      ? "Browse All Entered Items"
                      : desktopSection === "ai-matches"
                        ? "AI Match Center"
                        : "Settings"}
                </h2>
                <p className="text-sm text-silver/80">
                  {desktopSection === "dashboard"
                    ? "Real-time visibility for lost and found reporting with AI matching."
                    : desktopSection === "browse-items"
                      ? "Showing every reported lost and found item in the system feed."
                      : desktopSection === "ai-matches"
                        ? "Review AI-detected lost and found matches and take action."
                        : "Customize notifications and refresh behavior for your dashboard."}
                </p>
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
                              className={`h-2 rounded-full ${themeTokens.chartFill}`}
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
                          <p className="text-sm text-white">{settings.privacyMode ? "Activity hidden in privacy mode" : activity.text}</p>
                          <p className="mt-1 text-xs text-silver/70">{activity.time || "Waiting for new reports..."}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-6 grid gap-4">
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white">AI Match Center</h3>
                      <span className={`rounded-full px-3 py-1 text-xs ${themeTokens.highlightPill}`}>{"\u226595% Auto Notify"}</span>
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
                          <p className="text-xs text-silver/70">{settings.privacyMode ? "Location hidden" : item.location}</p>
                          <p className="text-xs text-silver/60">{item.timeAgo}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : desktopSection === "ai-matches" ? (
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
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${themeTokens.primaryButton}`}
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
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">Profile</h3>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm text-white">
                      <span className="mb-1 block text-silver/80">Profile name</span>
                      <input
                        type="text"
                        value={settings.profileName}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, profileName: event.target.value }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-onyx px-3 py-2 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                        placeholder="Enter profile name"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveProfileName}
                      disabled={isSavingProfile}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${themeTokens.primaryButton}`}
                    >
                      {isSavingProfile ? "Saving..." : "Save Profile Name"}
                    </button>
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">Theme</h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      { value: "aurora", label: "Aurora" },
                      { value: "midnight", label: "Midnight" },
                      { value: "sunrise", label: "Sunrise" },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            theme: theme.value as ThemeMode,
                          }))
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          settings.theme === theme.value
                            ? themeTokens.activeNav
                            : "border-white/15 bg-black/20 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">Notification Preferences</h3>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white">
                      <span>Realtime AI match alerts</span>
                      <input
                        type="checkbox"
                        checked={settings.realtimeNotifications}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, realtimeNotifications: event.target.checked }))
                        }
                        className="h-4 w-4 accent-cyan"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white">
                      <span>Email notifications</span>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, emailNotifications: event.target.checked }))
                        }
                        className="h-4 w-4 accent-cyan"
                      />
                    </label>
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">Security</h3>
                  <div className="mt-4 space-y-2">
                    <div className="relative">
                      <input
                        type={passwordVisibility.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                        }
                        placeholder="Current password"
                        className="w-full rounded-xl border border-white/10 bg-onyx px-3 py-2 pr-11 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordVisibility((current) => ({ ...current, current: !current.current }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/80 hover:text-white"
                        aria-label={passwordVisibility.current ? "Hide current password" : "Show current password"}
                      >
                        {passwordVisibility.current ? "◉" : "◎"}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={passwordVisibility.next ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                        placeholder="New password"
                        className="w-full rounded-xl border border-white/10 bg-onyx px-3 py-2 pr-11 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordVisibility((current) => ({ ...current, next: !current.next }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/80 hover:text-white"
                        aria-label={passwordVisibility.next ? "Hide new password" : "Show new password"}
                      >
                        {passwordVisibility.next ? "◉" : "◎"}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={passwordVisibility.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        placeholder="Confirm new password"
                        className="w-full rounded-xl border border-white/10 bg-onyx px-3 py-2 pr-11 text-white placeholder-white/40 focus:border-cyan focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/80 hover:text-white"
                        aria-label={passwordVisibility.confirm ? "Hide confirm password" : "Show confirm password"}
                      >
                        {passwordVisibility.confirm ? "◉" : "◎"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${themeTokens.secondaryButton}`}
                    >
                      {isChangingPassword ? "Updating..." : "Change Password"}
                    </button>
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">Preferences</h3>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white">
                      <span>Privacy mode (hide activity details)</span>
                      <input
                        type="checkbox"
                        checked={settings.privacyMode}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, privacyMode: event.target.checked }))
                        }
                        className="h-4 w-4 accent-cyan"
                      />
                    </label>

                    <label className="block text-sm text-white">
                      <span className="mb-1 block text-silver/80">Language</span>
                      <select
                        value={settings.language}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            language: event.target.value as "en" | "hi",
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-onyx px-3 py-2 text-white focus:border-cyan focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </label>
                  </div>
                </article>
              </div>
            )}
          </section>
      </div>

      <ReportFlow
        isOpen={showReportFlow}
        onClose={() => setShowReportFlow(false)}
        onSubmit={handleReportSubmit}
        initialItemType={reportItemType}
      />
    </main>
  );
}
