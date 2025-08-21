import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchProjectById, updateTaskPosition, createTask, type Priority } from "../api";
import { ProjectHeader } from "../components/board/projectHeader";
import { BoardColumn } from "../components/board/boardColumn";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { TaskCard } from "../components/board/taskCard";
import { ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "../contexts/authContext";

interface Task {
  id: number;
  priority: Priority | null;
  [key: string]: any;
}

interface Column {
  id: number;
  tasks: Task[];
  [key:string]: any;
}

const isInteractiveElement = (element: HTMLElement | null): boolean => {
  const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
  if (element && interactiveTags.includes(element.tagName.toLowerCase())) {
    return true;
  }
  if (element?.parentElement) {
    return isInteractiveElement(element.parentElement);
  }
  return false;
};

function SortableTaskCard({ task, canManage, onUpdate }: { task: Task; canManage: boolean; onUpdate: () => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const customListeners = {
    ...listeners,
    onPointerDown: (event: React.PointerEvent) => {
      if (isInteractiveElement(event.target as HTMLElement)) return;
      listeners?.onPointerDown?.(event);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (isInteractiveElement(event.target as HTMLElement)) return;
      listeners?.onKeyDown?.(event);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...customListeners}>
      <TaskCard task={task} canManage={canManage} onUpdate={onUpdate}/>
    </div>
  );
}

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<{ columns: Column[], ownerId?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const getProjectData = useCallback(() => {
    setLoading(true);
    fetchProjectById(projectId)
      .then(data => setProject(data))
      .catch(() => setError("Failed to load project data."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    getProjectData();
  }, [getProjectData]);

  const columns = useMemo(() => project?.columns ?? [], [project]);

  const findColumnByTaskId = (taskId: string) => {
    return columns.find(col => col.tasks.some((task: Task) => String(task.id) === taskId));
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = columns.flatMap(col => col.tasks).find(t => String(t.id) === event.active.id);
    if (task) setActiveTask(task);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    let overColumn = findColumnByTaskId(overId);
    if (!overColumn) {
      overColumn = columns.find(col => String(col.id) === overId);
    }

    if (!activeColumn || !overColumn) return;

    setProject(prev => {
      if (!prev) return null;

      if (activeColumn.id === overColumn.id) {
        const activeIndex = activeColumn.tasks.findIndex(t => String(t.id) === activeId);
        const overIndex = overColumn.tasks.findIndex(t => String(t.id) === overId);
        
        if (activeIndex !== overIndex) {
          const newTasksInColumn = arrayMove(activeColumn.tasks, activeIndex, overIndex);
          const newColumns = prev.columns.map(col => 
            col.id === activeColumn.id ? { ...col, tasks: newTasksInColumn } : col
          );
          updateTaskPosition(activeId, String(activeColumn.id), overIndex);
          return { ...prev, columns: newColumns };
        }
      } else {
        const activeIndex = activeColumn.tasks.findIndex(t => String(t.id) === activeId);
        const [movedTask] = activeColumn.tasks.slice(activeIndex, activeIndex + 1);

        let overIndex = overColumn.tasks.findIndex(t => String(t.id) === overId);
        if (overIndex === -1) {
          overIndex = overColumn.tasks.length;
        }

        const newActiveColumnTasks = activeColumn.tasks.filter(t => String(t.id) !== activeId);
        const newOverColumnTasks = [
          ...overColumn.tasks.slice(0, overIndex),
          movedTask,
          ...overColumn.tasks.slice(overIndex)
        ];
        
        const newColumns = prev.columns.map(col => {
          if (col.id === activeColumn.id) return { ...col, tasks: newActiveColumnTasks };
          if (col.id === overColumn.id) return { ...col, tasks: newOverColumnTasks };
          return col;
        });

        updateTaskPosition(activeId, String(overColumn.id), overIndex);
        return { ...prev, columns: newColumns };
      }
      return prev;
    });
  };

  const handleAddTask = useCallback(async (statusId: string | number, title: string) => {
    await createTask(Number(projectId), Number(statusId), title);
    getProjectData();
  }, [projectId, getProjectData]);

  const canManage = user && project && user.id === project.ownerId;

  if (loading) return <div className="p-4 md:p-8 text-center text-secondary">Loading project…</div>;
  if (error) return <div className="p-4 md:p-8 text-center text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="py-4 md:py-8">
      <div className="mb-4">
        <a href="#/" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>
      </div>
      <ProjectHeader project={project} onUpdate={setProject} />
      {canManage && (
        <div className="mt-4">
            <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface border border-secondary/20 text-sm text-primary">
                <Settings className="w-4 h-4"/> Project Settings
            </button>
        </div>
      )}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto py-4 scrollbar-hide">
          {columns.map((col: Column) => (
            <BoardColumn key={col.id} column={col} onAddTask={handleAddTask}>
              <SortableContext items={col.tasks.map((t: Task) => String(t.id))} strategy={verticalListSortingStrategy}>
                {col.tasks.map((t: Task) => (
                  <SortableTaskCard key={t.id} task={t} canManage={!!canManage} onUpdate={getProjectData} />
                ))}
              </SortableContext>
            </BoardColumn>
          ))}
        </div>
        {createPortal(
          <DragOverlay>{activeTask ? <TaskCard task={activeTask} canManage={!!canManage} onUpdate={getProjectData}/> : null}</DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}