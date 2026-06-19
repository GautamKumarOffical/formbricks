import type {
  TCreateWorkflowInput,
  TWorkflowListItem,
  TWorkflowResource,
  TWorkflowSortBy,
  TWorkflowStatus,
} from "@formbricks/workflows";
import { parseV3ApiError } from "@/modules/api/lib/v3-client";

/**
 * Typed fetch functions for the v3 Workflows HTTP API. These are the query/mutation functions the
 * TanStack Query hooks call — no React, no client state here. Modeled on
 * `modules/survey/list/lib/v3-surveys-client.ts` + the shared `modules/api/lib/v3-client.ts` error
 * parser. Inputs/outputs are typed against the `@formbricks/workflows` contract shapes; the v3
 * problem+json envelope is parsed into a `V3ApiError` for toast-friendly messages.
 *
 * The HTTP query-param family mirrors the surveys list and the `parse-list-query` handler:
 * `workspaceId`, `limit`, `cursor`, `sortBy`, `filter[name][contains]`, `filter[status][in]`.
 */

export interface TWorkflowListPage {
  data: TWorkflowListItem[];
  meta: {
    limit: number;
    nextCursor: string | null;
  };
}

export interface TWorkflowListFilters {
  nameContains?: string;
  statusIn?: TWorkflowStatus[];
  sortBy?: TWorkflowSortBy;
}

export function buildWorkflowListSearchParams({
  workspaceId,
  limit,
  cursor,
  filters,
}: {
  workspaceId: string;
  limit: number;
  cursor?: string | null;
  filters?: TWorkflowListFilters;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  searchParams.set("workspaceId", workspaceId);
  searchParams.set("limit", String(limit));

  if (filters?.sortBy) {
    searchParams.set("sortBy", filters.sortBy);
  }

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const trimmedName = filters?.nameContains?.trim();
  if (trimmedName) {
    searchParams.set("filter[name][contains]", trimmedName);
  }

  filters?.statusIn?.forEach((status) => {
    searchParams.append("filter[status][in]", status);
  });

  return searchParams;
}

export async function listWorkflows({
  workspaceId,
  limit,
  cursor,
  filters,
  signal,
}: {
  workspaceId: string;
  limit: number;
  cursor?: string | null;
  filters?: TWorkflowListFilters;
  signal?: AbortSignal;
}): Promise<TWorkflowListPage> {
  const response = await fetch(
    `/api/v3/workflows?${buildWorkflowListSearchParams({ workspaceId, limit, cursor, filters }).toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw await parseV3ApiError(response);
  }

  return (await response.json()) as TWorkflowListPage;
}

export async function createWorkflow(input: TCreateWorkflowInput): Promise<TWorkflowResource> {
  const response = await fetch("/api/v3/workflows", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseV3ApiError(response);
  }

  const body = (await response.json()) as { data: TWorkflowResource };
  return body.data;
}

export async function duplicateWorkflow(workflowId: string, name?: string): Promise<TWorkflowResource> {
  const response = await fetch(`/api/v3/workflows/${workflowId}/duplicate`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  });

  if (!response.ok) {
    throw await parseV3ApiError(response);
  }

  const body = (await response.json()) as { data: TWorkflowResource };
  return body.data;
}

export async function archiveWorkflow(workflowId: string): Promise<TWorkflowResource> {
  const response = await fetch(`/api/v3/workflows/${workflowId}/archive`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseV3ApiError(response);
  }

  const body = (await response.json()) as { data: TWorkflowResource };
  return body.data;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const response = await fetch(`/api/v3/workflows/${workflowId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseV3ApiError(response);
  }
}
