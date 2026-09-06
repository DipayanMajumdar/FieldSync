const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fs_token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  return res;
}

export async function login(email: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  if (data.token && typeof window !== "undefined") {
    localStorage.setItem("fs_token", data.token);
    localStorage.setItem("fs_user", JSON.stringify(data.user));
  }
  return data;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fs_token");
    localStorage.removeItem("fs_user");
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("fs_user");
  return u ? JSON.parse(u) : null;
}

export async function getProjects() {
  const res = await apiFetch("/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function getProject(id: number) {
  const res = await apiFetch(`/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function getWBSTree(projectId: number) {
  const res = await apiFetch(`/projects/${projectId}/wbs`);
  if (!res.ok) throw new Error("Failed to fetch WBS tree");
  return res.json();
}

export async function getSubmissions(params?: { limit?: number; offset?: number }) {
  const query = params ? `?limit=${params.limit ?? 20}&offset=${params.offset ?? 0}` : "";
  const res = await apiFetch(`/submissions${query}`);
  if (!res.ok) throw new Error("Failed to fetch submissions");
  return res.json();
}

export async function getAIQueue() {
  const res = await apiFetch("/ai-queue");
  if (!res.ok) throw new Error("Failed to fetch AI queue");
  return res.json();
}

export async function approveAISuggestion(id: number) {
  const res = await apiFetch(`/ai-queue/${id}/approve`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Failed to approve suggestion");
  }
  return res.json();
}

export async function rejectAISuggestion(id: number, reason: string) {
  const res = await apiFetch(`/ai-queue/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Failed to reject suggestion");
  }
  return res.json();
}

export async function getDashboard(projectId: number) {
  const res = await apiFetch(`/projects/${projectId}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function getEvidence(projectId: number) {
  const res = await fetch(`${API_BASE_URL}/evidence/${projectId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch evidence");
  return res.json();
}

export async function approveProgress(activityId: number, evidenceId: number, actualQuantity: number) {
  const res = await apiFetch("/approve", {
    method: "POST",
    body: JSON.stringify({ activity_id: activityId, evidence_id: evidenceId, actual_qty: actualQuantity }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => null);
    throw new Error((e as any)?.message || (e as any)?.err || "Failed to approve evidence");
  }
  return res.json();
}

export async function rejectEvidence(activityId: number, evidenceId: number, reason?: string) {
  const res = await apiFetch("/reject", {
    method: "POST",
    body: JSON.stringify({ activity_id: activityId, evidence_id: evidenceId, reason: reason || "Evidence rejected" }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => null);
    throw new Error((e as any)?.message || (e as any)?.err || "Failed to reject evidence");
  }
  return res.json();
}

export async function getDelayAlerts(projectId: number) {
  const res = await apiFetch(`/projects/${projectId}/delay-alerts`);
  if (!res.ok) throw new Error("Failed to fetch delay alerts");
  return res.json();
}

export async function getActivity(activityId: number) {
  return null;
}

export async function uploadEvidence(activityId: number, file: File, lat?: number, lng?: number) {
  return null;
}
