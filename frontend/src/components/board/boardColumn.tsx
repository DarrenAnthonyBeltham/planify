import { TaskCard } from "./taskCard";

export function BoardColumn({ column }: { column: any }) {
  return (
    <div className="w-80 bg-board rounded-lg p-3 flex-shrink-0">
      <h3 className="font-semibold text-primary p-1 mb-2">{column.title}</h3>
      <div className="task-list min-h-[100px]">
        {column.tasks?.map((task: any) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
