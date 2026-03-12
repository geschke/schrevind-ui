export type CommentStatus = "pending" | "approved" | "rejected" | "spam" | "deleted" | string;
export type CommentFilterStatus =
  "all" | "pending" | "approved" | "rejected" | "spam" | "deleted";

export type Comment = {
  ID: string;
  SiteID: number;
  EntryID: string | null;
  PostPath: string;
  ParentID: string | null;
  Status: CommentStatus;
  Author: string;
  Email: string;
  IP: string;
  AuthorUrl: string | null;
  Body: string;
  CreatedAt: number;
  ApprovedAt?: number;
  RejectedAt?: number;
};

export type CommentAction = "approve" | "reject" | "spam" | "delete";

export type CommentModerationItemRequest = {
  SiteID: number;
  CommentID: string;
};

export type CommentModerationBatchRequest = {
  Items: CommentModerationItemRequest[];
};

export type CommentModerationResult = {
  SiteID: number;
  CommentID: string;
  Changed: boolean;
  Status: string;
  Error?: string;
};

export type CommentModerationBatchResponse = {
  results: CommentModerationResult[];
};
