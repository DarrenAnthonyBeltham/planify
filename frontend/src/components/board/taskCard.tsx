import { MessageSquare, Paperclip } from "lucide-react";
import PrioritySelect from "./prioritySelect";
import { updateTaskPriority, type Priority } from "../../api";
import { motion } from "framer-motion";

type T = { [k: string]: any };

export function TaskCard({ task }: { task: T }) {
  const commentsCount =
    typeof task.commentsCount === "number"
      ? task.commentsCount
      : Array.isArray(task.comments)
      ? task.comments.length
      : 0;

  const attachmentsCount =
    typeof task.attachmentsCount === "number"
      ? task.attachmentsCount
      : Array.isArray(task.attachments)
      ? task.attachments.length
      : 0;

  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
      <a href={`#/task/${task.id}`} className="block bg-surface rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-primary">{task.title}</h3>
          <div onClick={(e) => e.preventDefault()} onMouseDown={(e) => e.stopPropagation()}>
            <PrioritySelect
              value={(task.priority ?? null) as Priority | null}
              onChange={async (next) => {
                const saved = await updateTaskPriority(String(task.id), next);
                window.dispatchEvent(new CustomEvent("planify:task-stats", { detail: { taskId: String(task.id), priority: saved.priority ?? null } }));
              }}
              className="text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-secondary text-sm">
          <span className="flex items-center gap-1"><MessageSquare size={14}/> {commentsCount}</span>
          <span className="flex items-center gap-1"><Paperclip size={14}/> {attachmentsCount}</span>
        </div>
      </a>
    </motion.div>
  );
}