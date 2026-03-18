// ─── Shared enums ────────────────────────────────────────────────────────────

export type TrustLevel = "new" | "verified" | "trusted";
export type ItemStatus = "LOST" | "FOUND";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface AdminSession {
  token: string;
  adminName: string;
  admin: {
    id: number | string;
    fullName: string;
    email: string;
    role: string;
  };
}

// ─── Pending (unreviewed) report ─────────────────────────────────────────────

export interface PendingItem {
  id: string;
  title: string;
  status: ItemStatus;
  mediaType: "image" | "video";
  mediaUrl: string | null;
  location: string;
  submittedBy: string;
  submittedAt: string | null;
  description: string;
  authenticityDetail: string;
  category: string;
  isUrgent: boolean;
  verificationStatus?: string;
  rejectionReason?: string | null;
}

export interface AdminItem extends PendingItem {
  approvedAt?: string | null;
}

// ─── Approved item ───────────────────────────────────────────────────────────

export interface VerifiedItem {
  id: string;
  title: string;
  status: ItemStatus;
  mediaType: "image" | "video";
  mediaUrl: string | null;
  location: string;
  submittedBy: string;
  approvedAt: string | null;
  category: string;
  verificationStatus?: string;
}

// ─── Platform user ───────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  trustLevel: TrustLevel;
  itemsReported: number;
  isSuspended: boolean;
  joinedAt: string;
}

// ─── Dashboard metrics ───────────────────────────────────────────────────────

export interface MetricsSummary {
  totalReports: number;
  pendingApprovals: number;
  verifiedItems: number;
  totalUsers: number;
  urgentCases: number;
  totalLostItems?: number;
  totalFoundItems?: number;
}

export interface SuspiciousReport {
  id: string;
  reason: string;
  status: string;
  createdAt: string | null;
  itemId: string | null;
  itemTitle: string | null;
  reporterName: string | null;
}
