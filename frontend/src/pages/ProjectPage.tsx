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
      .catch(err => setError('Failed to load project data.'))
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
      const task = findColumnContainingTask(activeId, project)
        ?.tasks.find((task: any) => String(task.id) === activeId);
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

      const activeTaskIndex = activeColumn.tasks.findIndex((task: any) => String(task.id) === activeId);
      if (activeTaskIndex === -1) return prev;

      let newProjectState = JSON.parse(JSON.stringify(prev));
      const [movedTask] = newProjectState.columns.find((c: any) => c.id === activeColumn.id).tasks.splice(activeTaskIndex, 1);
      
      const overCol = newProjectState.columns.find((c: any) => c.id === overColumn.id);
      if (!Array.isArray(overCol.tasks)) overCol.tasks = [];

      const overTaskIndex = overCol.tasks.findIndex((task: any) => String(task.id) === overId);
      const insertIndex = overTaskIndex !== -1 ? overTaskIndex : overCol.tasks.length;
      overCol.tasks.splice(insertIndex, 0, movedTask);
      
      return newProjectState;
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
        const activeTaskIndex = activeColumn.tasks.findIndex((task: any) => String(task.id) === activeId);
        const overTaskIndex = overColumn.tasks.findIndex((task: any) => String(task.id) === overId);
        
        if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
          const newTasks = arrayMove([...activeColumn.tasks], activeTaskIndex, overTaskIndex);
          const newColumns = project.columns.map((col: any) => 
            col.id === activeColumn.id ? { ...col, tasks: newTasks } : col
          );
          setProject({ ...project, columns: newColumns });
          
          newTasks.forEach((task, index) => {
            updateTaskPosition(String(task.id), String(activeColumn.id), index).catch(console.error);
          });
        }
      }
    } else {
      const finalTaskIndex = overColumn.tasks.findIndex((task: any) => String(task.id) === activeId);
      updateTaskPosition(activeId, String(overColumn.id), finalTaskIndex)
        .catch(err => {
            console.error("Failed to save task move:", err);
            fetchProjectById(projectId).then(setProject);
        });
    }
  }, [project, projectId]);

  const handleProjectUpdate = (updatedProject: any) => {
    setProject(updatedProject);
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <ProjectHeader project={project} onUpdate={handleProjectUpdate} />
      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd} 
        collisionDetection={closestCorners}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 flex-grow">
          {project.columns?.map((column: any) => (
            <SortableContext 
              key={column.id} 
              items={Array.isArray(column.tasks) ? column.tasks.map((t: any) => String(t.id)) : []}
            >
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
