import { useState } from "react";
import { updateTaskPriority, type Priority } from "../../api";
import PrioritySelect from "./prioritySelect";

interface Props {
  task: {
    id: string | number;
    priority: Priority | null;
  };
}

export function PriorityUpdater({ task }: Props) {
  const [currentPriority, setCurrentPriority] = useState<Priority | null>(task.priority);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePriorityChange = async (next: Priority | null) => {
    setIsUpdating(true);
    try {
      const saved = await updateTaskPriority(String(task.id), next);
      setCurrentPriority(saved.priority ?? null);
    } catch (error) {
      console.error("Failed to update priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={isUpdating ? 'opacity-50' : ''}>
        <PrioritySelect
            value={currentPriority}
            onChange={handlePriorityChange}
            className="text-sm"
        />
    </div>
  );
}