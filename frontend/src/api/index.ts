// ===== Types =====
export interface Project {
  id: number
  name: string
  description: string
  createdAt: string
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface UserTask {
  id: number
  title: string
  projectId: number
  projectName: string
  statusName: string
  dueDate: string | null
}

export interface Attachment {
  id: number
  fileName: string
  size: number
  url: string
}

export interface TaskComment {
  id: number
  text: string
  createdAt: string
  author?: User
}

export interface TaskDetail {
  id: number
  title: string
  description: string | null
  projectId: number
  projectName: string
  statusId: number
  statusName: string
  dueDate: string | null
  assignees: User[]
  collaborators: User[]
  attachments: Attachment[]
  comments: TaskComment[]
}

// ===== Config & helpers =====
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080/api"

const API_ORIGIN = new URL(API_BASE_URL).origin
const abs = (p: string) => (p?.startsWith("http") ? p : new URL(p, API_ORIGIN).toString())

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  // Merge headers and always inject Authorization if present
  const headers = new Headers(init.headers || {})
  const token = localStorage.getItem("planify_token")
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(url, { ...init, headers })

  if (res.status === 401) {
    localStorage.removeItem("planify_token")
    if (!location.hash.startsWith("#/login")) location.hash = "#/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    let msg = await res.text()
    try { msg = JSON.parse(msg).error || msg } catch {}
    throw new Error(msg || `Request failed: ${res.status}`)
  }

  return res.json()
}

// ===== Auth =====
export interface LoginCredentials {
  email: string
  password: string
}

export async function loginUser(
  credentials: LoginCredentials
): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })
  if (!res.ok) throw new Error("Login failed")
  const data = await res.json()
  if (data?.token) localStorage.setItem("planify_token", data.token)
  return data
}

// ===== Projects =====
export async function fetchProjects(): Promise<Project[]> {
  return api<Project[]>("/projects")
}

export async function fetchProjectById(id: string): Promise<any> {
  return api<any>(`/projects/${id}`)
}

export async function createProject(projectData: any) {
  return api("/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  })
}

export async function updateProjectDueDate(
  projectId: string,
  dueDate: string | null
) {
  return api(`/projects/${projectId}/duedate`, {
    method: "PATCH",
    body: JSON.stringify({ dueDate }),
  })
}

// ===== Users / Me =====
export async function searchUsers(query: string): Promise<User[]> {
  if (!query) return []
  return api<User[]>(`/users/search?q=${encodeURIComponent(query)}`)
}

export async function getMe(): Promise<User> {
  return api<User>("/me")
}

export async function updateMe(payload: Partial<Pick<User, "name" | "email">>) {
  return api<User>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function uploadAvatar(file: File) {
  const fd = new FormData()
  fd.append("file", file)
  const data = await api<{ url: string }>("/me/avatar", {
    method: "POST",
    body: fd, // api() will avoid setting Content-Type for FormData
  })
  return { url: abs(data.url) }
}

export async function changePassword(newPassword: string) {
  // matches backend: PATCH /me/password with { newPassword }
  return api("/me/password", {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  })
}

// ===== Tasks =====
export async function fetchMyTasks(userId?: number): Promise<UserTask[]> {
  const qs = userId ? `?userId=${userId}` : ""
  return api<UserTask[]>(`/me/tasks${qs}`)
}

export async function fetchTaskById(id: string): Promise<TaskDetail> {
  return api<TaskDetail>(`/tasks/${id}`)
}

export async function updateTaskPosition(
  taskId: string,
  statusId: string,
  position: number
) {
  return api(`/tasks/${taskId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ statusId: parseInt(statusId, 10), position }),
  })
}

export async function patchTask(
  id: string,
  payload: { title?: string | null; description?: string | null; dueDate?: string | null }
) {
  return api(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function updateTaskFields(
  id: string,
  payload: { title?: string | null; description?: string | null; dueDate?: string | null }
) {
  await api(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return fetchTaskById(id)
}

export async function uploadAttachment(taskId: string, file: File) {
  const fd = new FormData()
  fd.append("file", file)
  return api(`/tasks/${taskId}/attachments`, {
    method: "POST",
    body: fd,
  })
}

export async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  return api<Attachment[]>(`/tasks/${taskId}/attachments`)
}

export async function addAssignee(taskId: string, query: string) {
  return api(`/tasks/${taskId}/assignees`, {
    method: "POST",
    body: JSON.stringify({ query }),
  })
}

export async function addCollaborator(taskId: string, query: string) {
  return api(`/tasks/${taskId}/collaborators`, {
    method: "POST",
    body: JSON.stringify({ query }),
  })
}

export async function listComments(taskId: string): Promise<TaskComment[]> {
  return api<TaskComment[]>(`/tasks/${taskId}/comments`)
}

export async function addComment(
  taskId: string,
  payload: { authorId?: number; text: string }
) {
  return api(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
