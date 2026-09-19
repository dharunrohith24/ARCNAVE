import type { Analytics, CandidatePage, Observation, Prediction } from "../types";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new Error("MISSION LINK OFFLINE");
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.detail || "";
    } catch {
      // Keep the user-facing error stable when the server returns non-JSON.
    }
    throw new Error(detail || `API REQUEST FAILED (${response.status})`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("MALFORMED RESPONSE FROM MISSION LINK");
  }
}

export function predict(observation: Observation) {
  const payload = Object.fromEntries(
    Object.entries(observation).map(([key, value]) => [key, Number(value)]),
  );
  return request<Prediction>("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAnalytics() {
  return request<Analytics>("/analytics");
}

export function getCandidates(params: {
  search: string;
  status: string;
  probability: string;
  sort: string;
  page: number;
}) {
  const query = new URLSearchParams({
    search: params.search,
    status: params.status,
    probability: params.probability,
    sort: params.sort,
    page: String(params.page),
    page_size: "10",
  });
  return request<CandidatePage>(`/candidates?${query.toString()}`);
}