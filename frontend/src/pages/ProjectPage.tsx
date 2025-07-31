import { useEffect, useState } from 'react';
import { fetchProjectById } from '../api';
import { ProjectHeader } from '../components/board/projectHeader';
import { BoardColumn } from '../components/board/boardColumn';
import { DndContext, closestCorners, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !project) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setProject((prev: any) => {
      if (!prev) return null;

      const activeColumn = prev.columns.find((col: any) => 
        col.tasks.some((task: any) => String(task.id) === activeId)
      );

      let overColumn = prev.columns.find((col: any) => String(col.id) === overId);
      if (!overColumn) {
        overColumn = prev.columns.find((col: any) => 
          col.tasks.some((task: any) => String(task.id) === overId)
        );
      }
      
      if (!activeColumn || !overColumn) {
        return prev;
      }

      const activeTaskIndex = activeColumn.tasks.findIndex((task: any) => String(task.id) === activeId);
      let overTaskIndex = overColumn.tasks.findIndex((task: any) => String(task.id) === overId);

      let newProjectState = JSON.parse(JSON.stringify(prev));

      if (activeColumn.id === overColumn.id) {
        if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
          const activeColIndex = newProjectState.columns.findIndex((c: any) => c.id === activeColumn.id);
          newProjectState.columns[activeColIndex].tasks = arrayMove(
            newProjectState.columns[activeColIndex].tasks,
            activeTaskIndex,
            overTaskIndex
          );
        }
      } else {
        const activeColIndex = newProjectState.columns.findIndex((c: any) => c.id === activeColumn.id);
        const overColIndex = newProjectState.columns.findIndex((c: any) => c.id === overColumn.id);

        const [movedTask] = newProjectState.columns[activeColIndex].tasks.splice(activeTaskIndex, 1);
        
        if (overTaskIndex === -1) {
          overTaskIndex = newProjectState.columns[overColIndex].tasks.length;
        }

        newProjectState.columns[overColIndex].tasks.splice(overTaskIndex, 0, movedTask);
      }
      return newProjectState;
    });
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <ProjectHeader project={project} />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-grow">
          {project.columns?.map((column: any) => (
            <BoardColumn key={column.id} column={column} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}