export interface Project {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

const API_BASE_URL = "http://localhost:8080/api";

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  return response.json();
}