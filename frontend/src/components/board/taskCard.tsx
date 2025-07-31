export function TaskCard({ task }: { task: any }) {
  const priorityColors: { [key: string]: string } = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' };
  const assignees = task.assignees || [];

  return (
    <div className="bg-surface p-4 rounded-lg shadow-sm border border-secondary/10 cursor-pointer mb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-primary">{task.title}</h4>
        <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span>
      </div>
      <div className="flex items-center justify-end -space-x-1">
        {assignees.map((assignee: any) => (
          <img key={assignee.id} className="w-6 h-6 rounded-full border-2 border-surface" src={assignee.avatar} title={assignee.name} />
        ))}
      </div>
    </div>
  );
}