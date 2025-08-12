export type Priority = "Low" | "Medium" | "High" | "Urgent"

export interface Project {
  id: number
  name: string
  description: string
  createdAt: string
  dueDate?: string | null
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string | null
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
  priority?: Priority | null
  assignees: User[]
  collaborators: User[]
  attachments: Attachment[]
  comments: TaskComment[]
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080/api"

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const headers = new Headers(init.headers || {})
  const token = localStorage.getItem("planify_token")
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
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
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

export interface LoginCredentials { email: string; password: string }

export async function loginUser(credentials: LoginCredentials): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  })
  if (!res.ok) {
    let msg = await res.text()
    try { msg = JSON.parse(msg).error || msg } catch {}
    throw new Error(msg || "Login failed")
  }
  const data = await res.json()
  if (data?.token) localStorage.setItem("planify_token", data.token)
  return data
}

export async function fetchProjects() {
  return api<Project[]>("/projects")
}

export async function createProject(payload: { name: string; description?: string; dueDate: string | null; teamIds: number[] }) {
  return api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) })
}

export async function fetchProjectById(id: string): Promise<any> {
  const p = await api<any>(`/projects/${id}`)
  if ("due_date" in p) p.dueDate = p.due_date
  if (Array.isArray(p?.columns)) {
    p.columns.forEach((c: any) => Array.isArray(c.tasks) && c.tasks.sort((a: any, b: any) => a.position - b.position))
  }
  return p
}

export async function updateProjectDueDate(id: number, dueDate: string | null) {
  const body = JSON.stringify({ dueDate })
  const p = await api<any>(`/projects/${id}/due-date`, { method: "PATCH", body })
  if ("due_date" in p) p.dueDate = p.due_date
  return p
}

export async function fetchTaskById(id: string): Promise<TaskDetail> {
  const t = await api<TaskDetail>(`/tasks/${id}`)
  return {
    ...t,
    assignees: t.assignees ?? [],
    collaborators: t.collaborators ?? [],
    attachments: t.attachments ?? [],
    comments: t.comments ?? []
  }
}

export async function updateTaskFields(
  id: string,
  fields: Partial<Pick<TaskDetail, "title" | "description" | "dueDate" | "priority">>
): Promise<TaskDetail> {
  return api<TaskDetail>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(fields) })
}

export async function updateTaskPosition(taskId: string, statusId: string, position: number) {
  return api(`/tasks/${taskId}/move`, { method: "PATCH", body: JSON.stringify({ statusId: Number(statusId), position }) })
}

export async function listComments(taskId: string) {
  return api<TaskComment[]>(`/tasks/${taskId}/comments`)
}

export async function addComment(taskId: string, text: string) {
  return api<TaskComment[]>(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ text }) })
}

export async function addAssignee(taskId: string, query: string) {
  return api(`/tasks/${taskId}/assignees`, { method: "POST", body: JSON.stringify({ query }) })
}

export async function addCollaborator(taskId: string, query: string) {
  return api(`/tasks/${taskId}/collaborators`, { method: "POST", body: JSON.stringify({ query }) })
}

export async function uploadAttachment(taskId: string, file: File) {
  const fd = new FormData()
  fd.append("file", file)
  const token = localStorage.getItem("planify_token")
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd })
  if (!res.ok) throw new Error("Upload failed")
  return res.json()
}

export async function fetchMyTasks() {
  return api<UserTask[]>("/me/tasks")
}

export async function searchUsers(query: string, signal?: AbortSignal) {
  if (!query) return [] as User[]
  const url = `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`
  const token = localStorage.getItem("planify_token")
  const res = await fetch(url, { signal, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!res.ok) return []
  const users = await res.json()
  return users as User[]
}

export async function getMe(): Promise<User> {
  return api<User>("/me")
}

export async function updateMe(patch: { name: string; email: string }): Promise<User> {
  return api<User>("/me", { method: "PATCH", body: JSON.stringify(patch) })
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append("file", file)
  const token = localStorage.getItem("planify_token")
  const res = await fetch(`${API_BASE_URL}/me/avatar`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd })
  if (!res.ok) throw new Error("Upload failed")
  return res.json()
}

export async function changePassword(newPassword: string) {
  return api("/me/password", { method: "PATCH", body: JSON.stringify({ password: newPassword }) })
}