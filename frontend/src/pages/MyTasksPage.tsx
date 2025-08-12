import { useEffect, useMemo, useState } from "react"
import { fetchMyTasks, type UserTask } from "../api"
import { Calendar, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

export function MyTasksPage() {
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyTasks()
      .then(setTasks)
      .catch((e) => setError(e?.message || "Failed to load your tasks."))
      .finally(() => setLoading(false))
  }, [])

  const byProject = useMemo(() => {
    const map: Record<string, { open: UserTask[]; done: UserTask[] }> = {}
    for (const t of tasks) {
      const key = t.projectName || "General"
      if (!map[key]) map[key] = { open: [], done: [] }
      if (t.statusName === "Done") map[key].done.push(t)
      else map[key].open.push(t)
    }
    return map
  }, [tasks])

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold text-primary mb-6">My Tasks</h1>
      {loading && <div className="p-8 text-center text-secondary">Loading your tasks...</div>}
      {!loading && error && <div className="p-8 text-center text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="space-y-10">
          {Object.keys(byProject).length === 0 && (
            <div className="bg-surface border border-secondary/10 rounded-xl p-8 text-center text-secondary">No tasks yet.</div>
          )}
          {Object.entries(byProject).map(([name, g]) => (
            <section key={name} className="bg-surface border border-secondary/10 rounded-xl p-5">
              <h2 className="text-xl font-semibold text-primary mb-4">{name}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[...g.open, ...g.done].map((t) => (
                  <a key={t.id} href={`#/task/${t.id}`} className="flex items-center justify-between p-4 rounded-lg border border-secondary/10 hover:border-accent">
                    <div className="flex items-center gap-3">
                      {t.statusName === "Done" ? <CheckCircle2 className="text-green-500"/> : <span className="w-2.5 h-2.5 rounded-full bg-amber-500"/>}
                      <div>
                        <div className="font-medium text-primary">{t.title}</div>
                        <div className="text-xs text-secondary">{t.projectName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <Calendar className="w-4 h-4"/>
                      <span>{t.dueDate ? format(new Date(t.dueDate), "yyyy-MM-dd") : "No due date"}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}