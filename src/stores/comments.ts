import { defineStore } from "pinia";
import axios from "@/helper/axiosInstance";
import { computed, ref } from "vue";
import type {
  Comment,
  CommentAction,
  CommentFilterStatus,
  CommentModerationBatchRequest,
  CommentModerationBatchResponse,
  CommentModerationResult,
} from "@/types/comments";

export const useCommentsStore = defineStore("comments", () => {
  const comments = ref<Comment[]>([]);
  const commentsLoaded = ref(false);
  const getComments = computed(() => comments.value);

  function getItem(id: string) {
    return comments.value.find((item) => item.ID === id);
  }

  async function fetchComments(
    status: CommentFilterStatus = "all",
    options: { q?: string } = {}
  ) {
    const params: Record<string, string> = { status };
    const q = options.q?.trim();
    if (q) {
      params.q = q;
    }

    return axios
      .get("/comments/list", {
        withCredentials: true,
        params,
      })
      .then((response) => {
        const items = response.data?.items ?? {};
        const commentsDO: Comment[] = Object.values(items).map((item) => ({
          ...(item as Comment),
        }));
        comments.value = commentsDO;
        commentsLoaded.value = true;
        return response;
      })
      .catch((error) => {
        comments.value = [];
        commentsLoaded.value = false;
        throw error;
      });
  }

  function normalizeIds(input: string[] | string): string[] {
    if (Array.isArray(input)) {
      return input.filter(Boolean);
    }
    return input ? [input] : [];
  }

  function toPayload(ids: string[]): CommentModerationBatchRequest {
    const idSet = new Set(ids);
    const items = comments.value
      .filter((comment) => idSet.has(comment.ID))
      .map((comment) => ({
        SiteID: comment.SiteID,
        CommentID: comment.ID,
      }));

    return { Items: items };
  }

  async function runAction(
    action: CommentAction,
    idsInput: string[] | string,
    reloadStatus: CommentFilterStatus = "all"
  ): Promise<CommentModerationResult[]> {
    const ids = normalizeIds(idsInput);
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    const payload = toPayload(ids);
    if (payload.Items.length === 0) {
      return Promise.resolve([]);
    }

    return axios
      .post<CommentModerationBatchResponse>(`/comments/${action}`, payload, {
        withCredentials: true,
      })
      .then((response) => {
        const results = response.data?.results ?? [];
        return fetchComments(reloadStatus).then(() => results);
      })
      .catch((error) => {
        throw error;
      });
  }

  async function approveComments(
    idsInput: string[] | string,
    reloadStatus: CommentFilterStatus = "all"
  ) {
    return runAction("approve", idsInput, reloadStatus);
  }

  async function rejectComments(
    idsInput: string[] | string,
    reloadStatus: CommentFilterStatus = "all"
  ) {
    return runAction("reject", idsInput, reloadStatus);
  }

  async function spamComments(
    idsInput: string[] | string,
    reloadStatus: CommentFilterStatus = "all"
  ) {
    return runAction("spam", idsInput, reloadStatus);
  }

  async function deleteComments(
    idsInput: string[] | string,
    reloadStatus: CommentFilterStatus = "all"
  ) {
    return runAction("delete", idsInput, reloadStatus);
  }

  return {
    commentsLoaded,
    getComments,
    getItem,
    fetchComments,
    runAction,
    approveComments,
    rejectComments,
    spamComments,
    deleteComments,
  };
});
