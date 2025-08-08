import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, MessageSquare, Paperclip } from 'lucide-react';

export function TaskCard({ task }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const subTasks = Array.isArray(task.subTasks) ? task.subTasks : [];
  const completedSubTasks = subTasks.filter((st: any) => st.completed).length;

  const tags = [
    { text: 'In Progress', color: 'bg-blue-200 text-blue-800' },
    { text: 'High Priority', color: 'bg-red-200 text-red-800' },
  ];

  return (
    <a href={`#/task/${task.id}`} ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="block bg-surface p-3 rounded-md shadow-sm border border-secondary/10 cursor-pointer mb-3">
      <h4 className="font-semibold text-primary mb-2">{task.title}</h4>
      <div className="flex flex-wrap gap-1 mb-3">
        {tags.map(tag => (
          <span key={tag.text} className={`text-xs font-medium px-2 py-0.5 rounded-full ${tag.color}`}>{tag.text}</span>
        ))}
      </div>
      <div className="flex justify-between items-center text-secondary">
        <div className="flex items-center gap-3 text-sm">
          {subTasks.length > 0 && (
            <span className="flex items-center gap-1"><CheckSquare size={14} /> {completedSubTasks}/{subTasks.length}</span>
          )}
          <span className="flex items-center gap-1"><MessageSquare size={14} /> 3</span>
          <span className="flex items-center gap-1"><Paperclip size={14} /> 1</span>
        </div>
        <div className="flex items-center -space-x-2">
          {assignees.map((assigneeId: number) => (
            <div key={assigneeId} className="w-6 h-6 rounded-full border-2 border-surface bg-gray-300"></div>
          ))}
        </div>
      </div>
    </a>
  );
}
