import { useEffect, useState } from 'react';
import { fetchProjectById } from '../api';
import { ProjectHeader } from '../components/board/projectHeader';
import { BoardColumn } from '../components/board/boardColumn';
// import { TaskDetailModal } from '../components/modals/TaskDetailModal';
// import { AddMemberModal } from '../components/modals/AddMemberModal';

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null); // Replace 'any' with a proper type later
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProjectById(projectId)
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load project data.');
        setLoading(false);
      });
  }, [projectId]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6">
      <ProjectHeader project={project} />
      <div className="flex gap-6 overflow-x-auto pb-4">
        {project.columns?.map((column: any) => (
          <BoardColumn key={column.id} column={column} />
        ))}
      </div>
      {/* <TaskDetailModal ... /> */}
      {/* <AddMemberModal ... /> */}
    </div>
  );
}