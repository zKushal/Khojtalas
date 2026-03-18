import type {
  AdminItem,
  AdminSession,
  AppUser,
  MetricsSummary,
  PendingItem,
  SuspiciousReport,
  VerifiedItem,
} from "../types";
import { clearAdminSession, getAdminToken } from "./adminAuth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers = new Headers();

  if (body != null) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAdminToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    [key: string]: unknown;
  };

  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      clearAdminSession();
    }

    throw new Error(payload.message || "Request failed.");
  }

  return payload as T;
}

function normalizeItem(item: AdminItem): AdminItem {
  return {
    ...item,
    mediaType: item.mediaType === "video" ? "video" : "image",
    mediaUrl: item.mediaUrl || null,
    description: item.description || "",
    authenticityDetail: item.authenticityDetail || "",
    category: item.category || "Other",
    submittedAt: item.submittedAt || null,
    approvedAt: item.approvedAt || null,
    rejectionReason: item.rejectionReason || null,
    isUrgent: Boolean(item.isUrgent),
  };
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const payload = await request<{
    token: string;
    adminName?: string;
    admin: AdminSession["admin"];
  }>("/admin/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

  return {
    token: payload.token,
    adminName: payload.adminName || payload.admin.fullName,
    admin: payload.admin,
  };
}

export async function getDashboardStats(): Promise<MetricsSummary> {
  const payload = await request<{ stats: MetricsSummary }>("/admin/dashboard");
  return payload.stats;
}

export async function getAdminUsers(): Promise<AppUser[]> {
  const payload = await request<{ users: AppUser[] }>("/admin/users");
  return payload.users;
}

export async function getAdminItems(filters: {
  verificationStatus?: string;
  status?: "LOST" | "FOUND";
  limit?: number;
} = {}): Promise<AdminItem[]> {
  const searchParams = new URLSearchParams();

  if (filters.verificationStatus) {
    searchParams.set("verificationStatus", filters.verificationStatus);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.limit) {
    searchParams.set("limit", String(filters.limit));
  }

  const suffix = searchParams.toString();
  const payload = await request<{ items: AdminItem[] }>(`/admin/items${suffix ? `?${suffix}` : ""}`);
  return payload.items.map(normalizeItem);
}

export async function getPendingItems(): Promise<PendingItem[]> {
  const items = await getAdminItems({ verificationStatus: "under-review" });
  return items as PendingItem[];
}

export async function getVerifiedItems(): Promise<VerifiedItem[]> {
  const items = await getAdminItems({ verificationStatus: "verified" });
  return items as VerifiedItem[];
}

export async function approveItem(itemId: string) {
  return request(`/admin/items/${itemId}/approve`, { method: "PATCH" });
}

export async function rejectItem(itemId: string, reason: string) {
  return request(`/admin/items/${itemId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function getSuspiciousReports(): Promise<SuspiciousReport[]> {
  const payload = await request<{ reports: SuspiciousReport[] }>("/admin/reports");
  return payload.reports;
}
