import { useEffect, useState, useCallback } from 'react';
import { fetchProjectById } from '../api';
import { ProjectHeader } from '../components/board/projectHeader';
import { BoardColumn } from '../components/board/boardColumn';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent, DropAnimation } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);

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
        distance: 3, 
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    
    if (project) {
      const activeColumn = project.columns.find((col: any) => 
        Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === activeId)
      );
      
      if (activeColumn) {
        const task = activeColumn.tasks.find((task: any) => String(task.id) === activeId);
        setActiveTask(task);
      }
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

      const activeColumn = prev.columns.find((col: any) => 
        Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === activeId)
      );

      if (!activeColumn) return prev;
      let overColumn = prev.columns.find((col: any) => String(col.id) === overId);
      
      if (!overColumn) {
        overColumn = prev.columns.find((col: any) => 
          Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === overId)
        );
      }

      if (!overColumn) {
        overColumn = prev.columns.find((col: any) => 
          String(col.name)?.toLowerCase().replace(/\s+/g, '') === overId.toLowerCase() ||
          String(col.title)?.toLowerCase().replace(/\s+/g, '') === overId.toLowerCase()
        );
      }
      
      if (!overColumn) return prev;
      
      if (activeColumn.id !== overColumn.id) {
        const activeTaskIndex = activeColumn.tasks?.findIndex((task: any) => String(task.id) === activeId);
        
        if (activeTaskIndex === -1) return prev;

        const newColumns = [...prev.columns];
        const activeColIndex = newColumns.findIndex((c: any) => c.id === activeColumn.id);
        const overColIndex = newColumns.findIndex((c: any) => c.id === overColumn.id);

        if (activeColIndex === -1 || overColIndex === -1) return prev;

        const newActiveTasks = [...(activeColumn.tasks || [])];
        const [movedTask] = newActiveTasks.splice(activeTaskIndex, 1);
        newColumns[activeColIndex] = { ...activeColumn, tasks: newActiveTasks };
        const newOverTasks = Array.isArray(overColumn.tasks) ? [...overColumn.tasks] : [];
        
        if (String(over.id) === String(overColumn.id) || !newOverTasks.some(task => String(task.id) === overId)) {
          newOverTasks.push(movedTask);
        } else {
          const overTaskIndex = newOverTasks.findIndex((task: any) => String(task.id) === overId);
          const insertIndex = overTaskIndex !== -1 ? overTaskIndex : newOverTasks.length;
          newOverTasks.splice(insertIndex, 0, movedTask);
        }
        
        newColumns[overColIndex] = { ...overColumn, tasks: newOverTasks };
        
        return { ...prev, columns: newColumns };
      }
      
      return prev;
    });
  }, [project]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);

    if (!over || !project) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setProject((prev: any) => {
      if (!prev) return null;

      const activeColumn = prev.columns.find((col: any) => 
        Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === activeId)
      );

      if (!activeColumn) return prev;

      let overColumn = prev.columns.find((col: any) => String(col.id) === overId);
      
      if (!overColumn) {
        overColumn = prev.columns.find((col: any) => 
          Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === overId)
        );
      }

      if (!overColumn) {
        overColumn = prev.columns.find((col: any) => 
          String(col.name)?.toLowerCase().replace(/\s+/g, '') === overId.toLowerCase() ||
          String(col.title)?.toLowerCase().replace(/\s+/g, '') === overId.toLowerCase()
        );
      }
      
      if (!overColumn || !Array.isArray(activeColumn.tasks)) {
        return prev;
      }

      const activeTaskIndex = activeColumn.tasks.findIndex((task: any) => String(task.id) === activeId);
      
      if (activeTaskIndex === -1) {
        return prev;
      }

      let newColumns = [...prev.columns];

      if (activeColumn.id === overColumn.id) {
        const overTaskIndex = overColumn.tasks?.findIndex((task: any) => String(task.id) === overId);
        if (overTaskIndex !== -1) {
          const activeColIndex = newColumns.findIndex((c: any) => c.id === activeColumn.id);
          const newTasks = arrayMove(
            [...activeColumn.tasks],
            activeTaskIndex,
            overTaskIndex
          );
          newColumns[activeColIndex] = { ...activeColumn, tasks: newTasks };
        }
      }
      else {
        const activeColIndex = newColumns.findIndex((c: any) => c.id === activeColumn.id);
        const overColIndex = newColumns.findIndex((c: any) => c.id === overColumn.id);

        if (activeColIndex !== -1 && overColIndex !== -1) {
          const taskStillInActiveColumn = newColumns[activeColIndex].tasks?.some((task: any) => String(task.id) === activeId);
          
          if (taskStillInActiveColumn) {
            const newActiveTasks = [...(newColumns[activeColIndex].tasks || [])];
            const [movedTask] = newActiveTasks.splice(activeTaskIndex, 1);
            newColumns[activeColIndex] = { ...newColumns[activeColIndex], tasks: newActiveTasks };
            
            const newOverTasks = Array.isArray(newColumns[overColIndex].tasks) ? [...newColumns[overColIndex].tasks] : [];
            newOverTasks.push(movedTask);
            newColumns[overColIndex] = { ...newColumns[overColIndex], tasks: newOverTasks };
          }
        }
      }
      
      return { ...prev, columns: newColumns };
    });
  }, [project]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading project...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      <ProjectHeader project={project} />
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
              items={column.tasks?.map((task: any) => String(task.id)) || []}
              strategy={verticalListSortingStrategy}
            >
              <BoardColumn column={column} />
            </SortableContext>
          ))}
        </div>
                {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-90 transform rotate-2">
                <div className="font-medium text-gray-900">{activeTask.title}</div>
                {activeTask.description && (
                  <div className="text-sm text-gray-600 mt-2">{activeTask.description}</div>
                )}
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}