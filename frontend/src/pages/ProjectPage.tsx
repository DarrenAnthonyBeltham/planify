import { useEffect, useState, useCallback } from 'react';
import { fetchProjectById, updateTaskPosition } from '../api';
import { ProjectHeader } from '../components/board/projectHeader';
import { BoardColumn } from '../components/board/boardColumn';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over || !project) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const originalState = JSON.parse(JSON.stringify(project));

    const activeColumn = findColumnContainingTask(activeId, project);
    let overColumn = project.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, project);

    if (!activeColumn || !overColumn) return;

    let newProjectState = JSON.parse(JSON.stringify(project));
    const activeColIndex = newProjectState.columns.findIndex((c: any) => c.id === activeColumn.id);
    const overColIndex = newProjectState.columns.findIndex((c: any) => c.id === overColumn.id);
    const activeTaskIndex = activeColumn.tasks.findIndex((t: any) => String(t.id) === activeId);

    if (activeColumn.id === overColumn.id) {
      const overTaskIndex = overColumn.tasks.findIndex((t: any) => String(t.id) === overId);
      if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
        newProjectState.columns[activeColIndex].tasks = arrayMove(
          newProjectState.columns[activeColIndex].tasks,
          activeTaskIndex,
          overTaskIndex
        );
      }
    } else {
      const [movedTask] = newProjectState.columns[activeColIndex].tasks.splice(activeTaskIndex, 1);
      let overTaskIndex = overColumn.tasks?.findIndex((t: any) => String(t.id) === overId);
      
      if (overTaskIndex === -1 || overTaskIndex === undefined) {
        overTaskIndex = newProjectState.columns[overColIndex].tasks?.length || 0;
      }
      
      if (!Array.isArray(newProjectState.columns[overColIndex].tasks)) {
        newProjectState.columns[overColIndex].tasks = [];
      }
      newProjectState.columns[overColIndex].tasks.splice(overTaskIndex, 0, movedTask);
    }

    setProject(newProjectState);

    const finalOverColumn = newProjectState.columns[overColIndex];
    const finalTaskIndex = finalOverColumn.tasks.findIndex((t: any) => String(t.id) === activeId);

    updateTaskPosition(activeId, String(finalOverColumn.id), finalTaskIndex)
      .catch(err => {
        console.error("Failed to save task move:", err);
        setProject(originalState);
      });

  }, [project, projectId]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <ProjectHeader project={project} />
      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
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
