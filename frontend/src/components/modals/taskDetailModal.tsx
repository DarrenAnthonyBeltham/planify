import { Modal } from "./modal";

export function TaskDetailModal({ task, projectMembers, isOpen, onClose, onAssigneeChange }: any) {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      <p className="text-secondary mb-4">{task.description}</p>
      <h4 className="font-semibold text-primary mb-2">Assignees</h4>
      <div className="flex flex-col gap-2">
        {projectMembers.map((member: any) => (
          <label key={member.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-board">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              checked={task.assignees.some((a: any) => a.id === member.id)}
              onChange={() => onAssigneeChange(task.id, member.id)}
            />
            <img className="w-8 h-8 rounded-full" src={member.avatar} alt={member.name} />
            <span className="text-sm text-primary">{member.name}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}