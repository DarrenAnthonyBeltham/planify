import { useEffect, useState, useCallback } from 'react';
import { fetchProjectById, updateTaskPosition } from '../api';
import { ProjectHeader } from '../components/board/projectHeader';
import { BoardColumn } from '../components/board/boardColumn';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { TaskCard } from '../components/board/taskCard';

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
};

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);

  useEffect(() => {
    fetchProjectById(projectId)
      .then(data => setProject(data))
      .catch(() => setError('Failed to load project data.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const findColumnContainingTask = (taskId: string, proj: any) => {
    if (!proj) return null;
    for (const col of proj.columns) {
      if (Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === taskId)) {
        return col;
      }
    }
    return null;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    if (project) {
      const task = findColumnContainingTask(activeId, project)?.tasks.find((t: any) => String(t.id) === activeId);
      setActiveTask(task);
    }
  }, [project]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !project) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setProject((prev: any) => {
      if (!prev) return null;
      const activeColumn = findColumnContainingTask(activeId, prev);
      let overColumn = prev.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, prev);
      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return prev;

      const activeTaskIndex = activeColumn.tasks.findIndex((t: any) => String(t.id) === activeId);
      if (activeTaskIndex === -1) return prev;

      const next = JSON.parse(JSON.stringify(prev));
      const [movedTask] = next.columns.find((c: any) => c.id === activeColumn.id).tasks.splice(activeTaskIndex, 1);
      const overCol = next.columns.find((c: any) => c.id === overColumn.id);
      if (!Array.isArray(overCol.tasks)) overCol.tasks = [];
      const overTaskIndex = overCol.tasks.findIndex((t: any) => String(t.id) === overId);
      const insertIndex = overTaskIndex !== -1 ? overTaskIndex : overCol.tasks.length;
      overCol.tasks.splice(insertIndex, 0, movedTask);
      return next;
    });
  }, [project]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !project) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColumn = findColumnContainingTask(activeId, project);
    let overColumn = project.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, project);
    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
      if (activeId !== overId) {
        const aIdx = activeColumn.tasks.findIndex((t: any) => String(t.id) === activeId);
        const oIdx = overColumn.tasks.findIndex((t: any) => String(t.id) === overId);
        if (aIdx !== -1 && oIdx !== -1) {
          const newTasks = arrayMove([...activeColumn.tasks], aIdx, oIdx);
          const newCols = project.columns.map((col: any) => col.id === activeColumn.id ? { ...col, tasks: newTasks } : col);
          setProject({ ...project, columns: newCols });
          newTasks.forEach((t, idx) => {
            updateTaskPosition(String(t.id), String(activeColumn.id), idx).catch(console.error);
          });
        }
      }
    } else {
      const finalTaskIndex = overColumn.tasks.findIndex((t: any) => String(t.id) === activeId);
      updateTaskPosition(activeId, String(overColumn.id), finalTaskIndex)
        .catch(() => fetchProjectById(projectId).then(setProject));
    }
  }, [project, projectId]);

  const handleProjectUpdate = (updated: any) => setProject(updated);

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <ProjectHeader project={project} onUpdate={handleProjectUpdate} />
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-grow">
          {project.columns?.map((column: any) => (
            <SortableContext key={column.id} items={Array.isArray(column.tasks) ? column.tasks.map((t: any) => String(t.id)) : []}>
              <BoardColumn column={column} />
            </SortableContext>
          ))}
        </div>
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}
