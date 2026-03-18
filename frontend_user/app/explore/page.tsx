"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { type LostFoundItem } from "../../components/ItemCard";
import MainNavigation from "../../components/MainNavigation";
import ReportFlow, { type ReportFlowData } from "../../components/ReportFlow";
import SearchBar from "../../components/SearchBar";
import FilterPanel, { type ExploreFilters } from "../../components/FilterPanel";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyStateMessage from "../../components/EmptyStateMessage";
import ItemDetailsModal from "../../components/ItemDetailsModal";
import ExploreTile from "../../components/ExploreTile";
import { useAuth } from "../../context/AuthContext";
import api, { buildMediaUrl, getApiErrorMessage } from "../../lib/api";

type ExploreItem = LostFoundItem & {
  category: "Electronics" | "Documents" | "Pets" | "Urgent" | "Other";
  scope: "nearby" | "global";
};

const FILTER_STORAGE_KEY = "khojtalas_explore_filters";

const defaultFilters: ExploreFilters = {
  category: "All",
  status: "ALL",
  scope: "nearby",
  verifiedOnly: true,
};

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<ExploreFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [showReportFlow, setShowReportFlow] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ExploreFilters;
        setFilters({ ...defaultFilters, ...parsed });
      }
    } catch {
      setFilters(defaultFilters);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    let mounted = true;

    async function fetchItems() {
      try {
        setIsLoading(true);
        setApiError("");
        const response = await api.get("/user/items");
        const nextItems = (response.data.items || []).map((item: ExploreItem) => ({
          ...item,
          mediaUrl: buildMediaUrl(item.mediaUrl),
        }));

        if (mounted) {
          setItems(nextItems);
        }
      } catch (error) {
        console.error("Failed to fetch verified items:", error);
        if (mounted) {
          setApiError(getApiErrorMessage(error, "Failed to load explore items."));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchItems();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openReport") !== "1") return;

    if (isAuthenticated || localStorage.getItem("kt_user_token")) {
      setShowReportFlow(true);
    }
    router.replace("/explore");
  }, [isAuthenticated, router]);

  const visibleItems = useMemo(() => {
    const normalized = items.filter((item) => {
      if (item.status === "FOUND") {
        return item.mediaType === "video" && Boolean(item.mediaUrl);
      }
      return true;
    });

    return normalized.filter((item) => {
      const searchMatches =
        debouncedSearch.length === 0 ||
        item.title.toLowerCase().includes(debouncedSearch) ||
        item.location.toLowerCase().includes(debouncedSearch) ||
        item.category.toLowerCase().includes(debouncedSearch) ||
        item.tags.some((tag) => tag.toLowerCase().includes(debouncedSearch));

      const categoryMatches =
        filters.category === "All" ||
        (filters.category === "Urgent"
          ? item.tags.includes("urgent") || item.category === "Urgent"
          : item.category === filters.category);

      const statusMatches = filters.status === "ALL" || item.status === filters.status;
      const scopeMatches = item.scope === filters.scope;
      const verifiedMatches = !filters.verifiedOnly || item.verificationStatus === "verified";

      return searchMatches && categoryMatches && statusMatches && scopeMatches && verifiedMatches;
    });
  }, [debouncedSearch, filters, items]);

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
      formData.append("scope", filters.scope);

      if (data.image) formData.append("image", data.image);
      if (data.video) formData.append("video", data.video);

      await api.post("/user/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✓ Item reported successfully! It's now under review.");
    } catch (error) {
      alert(getApiErrorMessage(error, "Failed to submit report."));
      throw error;
    }
  };

  const previewItems = visibleItems.slice(0, 2);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReportClick = () => {
    if (!isAuthenticated && !localStorage.getItem("kt_user_token")) {
      router.push("/signup?next=%2Fexplore&intent=report");
      return;
    }
    setShowReportFlow(true);
  };

  const handleProfileClick = () => {
    if (!isAuthenticated && !localStorage.getItem("kt_user_token")) {
      router.push("/login?next=%2Fexplore&intent=profile");
      return;
    }
    router.push("/profile");
  };

  return (
    <main className="h-screen overflow-y-auto bg-obsidian pb-36 text-white">
      <Header />

      <section className="mx-auto w-full max-w-md px-4 pt-20">
        <div className="sticky top-16 z-20 -mx-1 mb-4 space-y-3 rounded-b-[28px] bg-gradient-to-b from-obsidian via-obsidian/95 to-obsidian/70 px-1 pb-3 pt-1 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan/70">Discovery</p>
              <h1 className="text-2xl font-bold leading-tight">Explore nearby signals</h1>
            </div>
          </div>

          <SearchBar value={searchText} onChange={setSearchText} />
          <FilterPanel filters={filters} onChange={setFilters} />

          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              {visibleItems.length} results
            </span>
            <span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-[11px] text-cyan">
              {filters.verifiedOnly ? "Verified priority" : "All trust levels"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              {filters.scope === "nearby" ? "Nearby radius" : "Global reach"}
            </span>
          </div>
        </div>

        {apiError ? (
          <div className="rounded-3xl border border-magenta/20 bg-magenta/10 px-4 py-8 text-center text-sm text-magenta">
            {apiError}
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : visibleItems.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-silver/60">
                  Quick Preview
                </p>
                <button
                  onClick={scrollToResults}
                  className="text-[11px] font-semibold text-cyan transition hover:text-white"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {previewItems.map((item) => (
                  <ExploreTile key={item.id} item={item} compact onOpen={scrollToResults} />
                ))}
              </div>
            </div>

            <div ref={resultsRef} className="space-y-2 scroll-mt-40">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-silver/60">
                  All Results
                </p>
                <p className="text-[11px] text-silver/55">
                  {filters.status === "ALL" ? "Lost + Found" : filters.status}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visibleItems.map((item) => (
                  <ExploreTile key={item.id} item={item} onOpen={setSelectedItem} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <MainNavigation onReportClick={handleReportClick} onProfileClick={handleProfileClick} />

      <ItemDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <ReportFlow
        isOpen={showReportFlow}
        onClose={() => setShowReportFlow(false)}
        onSubmit={handleReportSubmit}
        initialItemType="lost"
      />
    </main>
  );
}
