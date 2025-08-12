import { MessageSquare, Paperclip } from "lucide-react"

type Priority = "Low" | "Medium" | "High" | "Urgent"

export function TaskCard({ task }: { task: any }) {
  const commentsCount = typeof task.commentsCount === "number"
    ? task.commentsCount
    : Array.isArray(task.comments) ? task.comments.length : 0

  const attachmentsCount = typeof task.attachmentsCount === "number"
    ? task.attachmentsCount
    : Array.isArray(task.attachments) ? task.attachments.length : 0

  const priorityClass =
    task.priority === "Urgent" ? "bg-red-100 text-red-800" :
    task.priority === "High" ? "bg-rose-100 text-rose-800" :
    task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
    task.priority === "Low" ? "bg-green-100 text-green-800" : ""

  return (
    <a
      href={`#/task/${task.id}`}
      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-primary mb-2">{task.title}</h3>
      <div className="flex gap-2 mb-3">
        {task.statusName && (
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{task.statusName}</span>
        )}
        {task.priority && (
          <span className={`px-2 py-1 text-xs rounded ${priorityClass}`}>{task.priority} Priority</span>
        )}
      </div>
      <div className="flex gap-4 text-secondary text-sm">
        <span className="flex items-center gap-1"><MessageSquare size={14}/> {commentsCount}</span>
        <span className="flex items-center gap-1"><Paperclip size={14}/> {attachmentsCount}</span>
      </div>
    </a>
  )
}
