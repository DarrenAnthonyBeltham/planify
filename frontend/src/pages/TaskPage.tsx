import { useEffect, useState } from "react";
import { fetchTaskById, type TaskDetail } from "../api";
import { CheckCircle2, Calendar, Users, ChevronRight, Plus, Paperclip, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export function TaskPage({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTaskById(taskId)
      .then(setTask)
      .catch((e) => setError(e?.message || "Failed to load task"))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading task…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!task) return <div className="p-8 text-center text-secondary">No task found.</div>;

  const done = task.statusName === "Done";

  return (
    <div className="py-6">
      <div className="flex items-center text-sm text-secondary mb-4">
        <a href={`#/project/${task.projectId}`} className="hover:underline">{task.projectName || "Project"}</a>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span>Task</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        {done && <CheckCircle2 className="w-6 h-6 text-green-500" />}
        <h1 className="text-3xl font-bold text-primary">{task.title || "Untitled task"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-secondary mb-2">Description</h3>
            <p className="text-primary leading-relaxed min-h-[80px]">{task.description ?? "No description"}</p>
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary">Activity</h3>
              <button className="text-sm px-3 py-1 rounded-md bg-accent text-white">Add comment</button>
            </div>
            <div className="text-secondary text-sm">
              <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4" /> No comments yet</div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-secondary">Assignee</h3>
              <button className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board">Change</button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {task.assignees?.length ? (
                task.assignees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20" />
                    <span className="text-primary text-sm">{a.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-secondary text-sm">Unassigned</span>
              )}
            </div>
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-secondary mb-2">Due date</h3>
            {task.dueDate ? (
              <div className="flex items-center gap-2 text-primary"><Calendar className="w-4 h-4 text-accent" /> {format(new Date(task.dueDate), "PPP")}</div>
            ) : (
              <div className="text-secondary text-sm">No due date</div>
            )}
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2"><Users className="w-4 h-4" /> Collaborators</h3>
              <button className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board">Add</button>
            </div>
            <div className="flex -space-x-2">
              {task.assignees?.length ? (
                task.assignees.map((a) => (
                  <div key={a.id} className="w-8 h-8 rounded-full bg-accent/20 border-2 border-surface" title={a.name} />
                ))
              ) : (
                <span className="text-secondary text-sm">None</span>
              )}
            </div>
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2"><Paperclip className="w-4 h-4" /> Files</h3>
              <button className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board"><Plus className="w-3 h-3" /></button>
            </div>
            <div className="text-secondary text-sm">No files attached</div>
          </section>
        </div>
      </div>
    </div>
  );
}
