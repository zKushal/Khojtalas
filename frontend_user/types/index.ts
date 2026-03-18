export type VerificationStatus = "under-review" | "verified";
export type UserTrustLevel = "new" | "verified" | "trusted";

export type EnhancedLostFoundItem = {
  id: string;
  status: "LOST" | "FOUND";
  mediaType: "image" | "video";
  mediaUrl: string;
  title: string;
  description: string;
  tags: string[];
  reportedBy: string;
  location: string;
  timeAgo: string;
  helpfulCount: string;
  detailsCount: string;
  shareCount: string;
  verificationStatus: VerificationStatus;
  userTrustLevel: UserTrustLevel;
  authenticityDetail?: string;
};

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
