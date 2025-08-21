import { MessageSquare, Paperclip, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { PriorityUpdater } from "./priorityUpdater";
import type { Priority } from "../../api";

interface TaskCardType {
  id: string | number;
  priority: Priority | null;
  [key: string]: any;
}

export function TaskCard({ task, canManage, onUpdate }: { task: TaskCardType; canManage: boolean; onUpdate: () => void; }) {
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
    <motion.div 
      whileHover={{ scale: 1.03 }} 
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <a href={`#/task/${task.id}`} className="block bg-surface rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-primary">{task.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDown={(e) => e.stopPropagation()}>
              <PriorityUpdater task={task} />
            </div>
            {canManage && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="text-secondary hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
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