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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, { headers: { "Content-Type": "application/json" } })
  if (!res.ok) throw new Error("Failed to fetch projects")
  return res.json()
}

export interface LoginCredentials {
  email: string
  password: string
}

export async function loginUser(credentials: LoginCredentials): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  })
  if (!res.ok) throw new Error("Login failed")
  return res.json()
}

export async function fetchProjectById(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, { headers: { "Content-Type": "application/json" } })
  if (!res.ok) throw new Error("Failed to fetch project details")
  return res.json()
}

export async function searchUsers(query: string): Promise<User[]> {
  if (!query) return []
  const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, { headers: { "Content-Type": "application/json" } })
  if (!res.ok) throw new Error("Failed to search users")
  return res.json()
}

export async function updateTaskPosition(taskId: string, statusId: string, position: number) {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statusId: parseInt(statusId, 10), position })
  })
  if (!res.ok) throw new Error("Failed to update task position")
  return res.json()
}

export async function updateProjectDueDate(projectId: string, dueDate: string | null) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/duedate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dueDate })
  })
  if (!res.ok) throw new Error("Failed to update project due date")
  return res.json()
}

export async function createProject(projectData: any) {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData)
  })
  if (!res.ok) throw new Error("Failed to create project")
  return res.json()
}

export async function fetchMyTasks(userId?: number) {
  const qs = userId ? `?userId=${userId}` : ""
  const res = await fetch(`${API_BASE_URL}/me/tasks${qs}`, { headers: { "Content-Type": "application/json" } })
  if (!res.ok) throw new Error("Failed to fetch tasks")
  return res.json()
}

export async function fetchTaskById(id: string): Promise<TaskDetail> {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { headers: { "Content-Type": "application/json" } })
  if (!res.ok) throw new Error("Failed to fetch task")
  return res.json()
}

export async function patchTask(id: string, payload: { description?: string | null; dueDate?: string | null }) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error("Failed to update task")
  return res.json()
}

export async function uploadAttachment(taskId: string, file: File) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
    method: "POST",
    body: fd
  })
  if (!res.ok) throw new Error("Failed to upload file")
  return res.json()
}

export async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`)
  if (!res.ok) throw new Error("Failed to fetch attachments")
  return res.json()
}

export async function addAssignee(taskId: string, query: string) {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/assignees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
  if (!res.ok) throw new Error("Failed to add assignee")
  return res.json()
}

export async function addCollaborator(taskId: string, query: string) {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
  if (!res.ok) throw new Error("Failed to add collaborator")
  return res.json()
}

export async function listComments(taskId: string) {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`)
  if (!res.ok) throw new Error("Failed to fetch comments")
  return res.json()
}

export async function addComment(taskId: string, payload: { authorId?: number; text: string }) {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error("Failed to add comment")
  return res.json()
}

export async function updateTaskFields(
  id: string,
  payload: { title?: string | null; description?: string | null; dueDate?: string | null }
) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to update task")
  return fetchTaskById(id)
}