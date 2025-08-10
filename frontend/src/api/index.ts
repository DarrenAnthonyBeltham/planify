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

export async function fetchMyTasks(userId?: number): Promise<UserTask[]> {
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
