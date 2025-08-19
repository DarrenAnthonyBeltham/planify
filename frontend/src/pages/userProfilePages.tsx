import { useEffect, useState } from "react"
import { fetchUserProjects, fetchUserSummary } from "../api"

function norm(url?: string | null) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api"
  const origin = base.replace(/\/api\/?$/, "")
  return url.startsWith("/") ? origin + url : origin + "/" + url
}

export function UserProfilePage({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchUserSummary(userId), fetchUserProjects(userId)])
      .then(([s, ps]) => { setSummary(s); setProjects(ps || []) })
      .catch((e) => setError(e?.message || "Failed to load profile"))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-8 text-center text-secondary">Loading profile…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!summary) return null

  return (
    <div className="py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-board">
          {summary.avatar ? <img src={norm(summary.avatar)} className="w-full h-full object-cover" /> : null}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary">{summary.name}</h1>
          <div className="text-secondary">{summary.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary">Assigned</div>
          <div className="text-2xl font-semibold text-primary">{summary.assigned}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary">Collaborating</div>
          <div className="text-2xl font-semibold text-primary">{summary.collaborating}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary">Comments</div>
          <div className="text-2xl font-semibold text-primary">{summary.comments}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary">Projects</div>
          <div className="text-2xl font-semibold text-primary">{summary.projects}</div>
        </div>
      </div>

      <div className="bg-surface border border-secondary/10 rounded-xl">
        <div className="px-5 py-4 text-primary font-semibold border-b border-secondary/10">Projects</div>
        <div className="p-5 grid gap-4 md:grid-cols-2">
          {projects.length === 0 ? (
            <div className="text-secondary">No projects</div>
          ) : (
            projects.map((p) => (
              <a key={p.id} href={`#/project/${p.id}`} className="block rounded-lg border border-secondary/10 bg-white p-4 hover:shadow transition">
                <div className="text-lg font-semibold text-accent">{p.name}</div>
                <div className="text-secondary">{p.description}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}