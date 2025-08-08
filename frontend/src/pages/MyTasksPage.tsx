import { useEffect, useMemo, useState } from "react";
import { fetchMyTasks, type UserTask } from "../api";
import { Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function MyTasksPage() {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks(1)
      .then(setTasks)
      .catch((e) => setError(e?.message || "Failed to load your tasks."))
      .finally(() => setLoading(false));
  }, []);

  const byProject = useMemo(() => {
    const map: Record<string, { open: UserTask[]; done: UserTask[] }> = {};
    for (const t of tasks) {
      const key = t.projectName || "General";
      if (!map[key]) map[key] = { open: [], done: [] };
      if (t.statusName === "Done") map[key].done.push(t);
      else map[key].open.push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold text-primary mb-6">My Tasks</h1>
      {loading && <div className="p-8 text-center text-secondary">Loading your tasks...</div>}
      {!loading && error && <div className="p-8 text-center text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="space-y-10">
          {Object.keys(byProject).length === 0 && (
            <div className="bg-surface border border-secondary/10 rounded-xl p-8 text-center text-secondary">No tasks to show.</div>
          )}
          {Object.entries(byProject).map(([project, groups]) => (
            <section key={project} className="bg-surface border border-secondary/10 rounded-xl shadow-sm">
              <header className="flex items-center justify-between px-5 py-4 border-b border-secondary/10">
                <h2 className="text-2xl font-semibold text-accent">{project}</h2>
              </header>
              <div className="divide-y divide-secondary/10">
                {[...groups.open, ...groups.done].map((t) => {
                  const done = t.statusName === "Done";
                  return (
                    <div key={t.id} className={`flex items-center justify-between px-5 py-3 ${done ? "opacity-60" : ""}`}>
                      <a href={`#/project/${t.projectId}`} className="hover:underline">
                        <span className="text-primary font-medium">{t.title}</span>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-secondary">
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(t.dueDate), "MMM dd")}
                          </span>
                        )}
                        {done && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
