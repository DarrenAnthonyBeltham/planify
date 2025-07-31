import type { Project } from "../../api";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a href={`#/project/${project.id}`} className="block">
      <div className="bg-surface p-5 rounded-lg shadow-md hover:ring-2 hover:ring-accent cursor-pointer transition-all duration-200 transform hover:-translate-y-1">
        <h3 className="font-bold text-lg text-accent">{project.name}</h3>
        <p className="text-secondary text-sm mt-1">{project.description}</p>
      </div>
    </a>
  );
}
