import { TaskCard } from './taskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

export function BoardColumn({ column, onAddTask }: any) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const tasks = Array.isArray(column.tasks) ? column.tasks : [];
  const taskIds = tasks.map((task: any) => task.id);

  const columnAccentColors: { [key: string]: string } = {
    'On Check': 'bg-yellow-500',
    'Scheduled': 'bg-blue-500',
    'In Progress': 'bg-purple-500',
    'Done': 'bg-green-500',
  };

  return (
    <div className="w-80 bg-board rounded-lg p-1 flex-shrink-0 flex flex-col">
      <div className="flex items-center justify-between p-2 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${columnAccentColors[column.title] || 'bg-gray-400'}`}></span>
          <h3 className="font-semibold text-primary">{column.title}</h3>
        </div>
        <span className="text-sm font-medium bg-surface text-secondary px-2 py-1 rounded-md">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="task-list min-h-[100px] flex-grow overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-accent/50 scrollbar-track-transparent">
          {tasks.map((task: any) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
      <button onClick={onAddTask} className="w-full text-left mt-2 px-2 py-2 text-secondary hover:bg-surface/50 rounded-md transition-colors flex-shrink-0">
        + Add a card
      </button>
    </div>
  );
}
