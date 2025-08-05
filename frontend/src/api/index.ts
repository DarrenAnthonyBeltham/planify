export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

const API_BASE_URL = "http://localhost:8080/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("planify_token");
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  return response.json();
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) { throw new Error('Login failed'); }
  return response.json();
}

export async function fetchProjectById(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) { throw new Error("Failed to fetch project details"); }
  return response.json();
}

export async function searchUsers(query: string): Promise<User[]> {
  if (!query) return [];
  const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) { throw new Error("Failed to search users"); }
  return response.json();
}

export async function updateTaskPosition(taskId: string, statusId: string, position: number) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ statusId: parseInt(statusId, 10), position }),
  });
  if (!response.ok) {
    throw new Error("Failed to update task position");
  }
  return response.json();
}

export async function updateProjectDueDate(projectId: string, dueDate: string | null) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/duedate`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ dueDate }),
  });
  if (!response.ok) {
    throw new Error("Failed to update project due date");
  }
  return response.json();
}

export async function createProject(projectData: any) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    throw new Error("Failed to create project");
  }
  return response.json();
}