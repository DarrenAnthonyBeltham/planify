// src/pages/UserProfilePage.tsx
import { useEffect, useState } from "react"
import {
  fetchUserPublic,
  fetchUserSummary,
  fetchUserProjectsById,
  type PublicUser,
  type UserSummary,
  type PublicUserProject,
} from "../api"

function Avatar({ url, size = 80 }: { url?: string | null; size?: number }) {
  const fallback = "https://placehold.co/160x160?text=User"
  const src = url || fallback
  return (
    <img
      src={src}
      onError={(e) => ((e.currentTarget as HTMLImageElement).src = fallback)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}

export function UserProfilePage({ userId }: { userId: string }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [projects, setProjects] = useState<PublicUserProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([
      fetchUserPublic(userId).catch(() => null),
      fetchUserSummary(userId).catch(() => null),
      fetchUserProjectsById(userId).catch(() => [] as PublicUserProject[]),
    ])
      .then(([u, s, p]) => {
        if (!alive) return
        setUser(u as PublicUser | null)
        setSummary(s as UserSummary | null)
        setProjects(Array.isArray(p) ? p : [])
      })
      .catch((e) => {
        if (!alive) return
        setError(e?.message || "Failed to load user")
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [userId])

  if (loading) return <div className="p-8 text-center text-secondary">Loading…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!user) return <div className="p-8 text-center text-secondary">User not found.</div>

  const safeProjects = Array.isArray(projects) ? projects : []
  const activities = Array.isArray(summary?.recentActivity) ? summary!.recentActivity! : []

  return (
    <div className="py-8">
      <div className="bg-surface border border-secondary/10 rounded-xl p-6 flex items-center gap-5">
        <Avatar url={user.avatar} size={80} />
        <div>
          <div className="text-2xl font-semibold text-primary">{user.name}</div>
          <div className="text-secondary">{user.email}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-6">
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary uppercase">Assigned</div>
          <div className="text-2xl font-bold text-primary mt-1">{summary?.assignedCount ?? 0}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary uppercase">Collaborator</div>
          <div className="text-2xl font-bold text-primary mt-1">{summary?.collaboratorCount ?? 0}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary uppercase">Comments</div>
          <div className="text-2xl font-bold text-primary mt-1">{summary?.commentCount ?? 0}</div>
        </div>
        <div className="bg-surface border border-secondary/10 rounded-xl p-4">
          <div className="text-xs text-secondary uppercase">Projects</div>
          <div className="text-2xl font-bold text-primary mt-1">{summary?.projectCount ?? 0}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-primary">Projects</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeProjects.map((p) => (
            <a
              key={p.id}
              href={`#/project/${p.id}`}
              className="block bg-surface border border-secondary/10 rounded-xl p-4 hover:border-accent"
            >
              <div className="font-semibold text-primary">{p.name}</div>
              {p.description ? (
                <div className="text-sm text-secondary mt-1 line-clamp-2">{p.description}</div>
              ) : null}
            </a>
          ))}
          {safeProjects.length === 0 ? <div className="text-secondary">No projects found.</div> : null}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-primary mb-3">Recent Activity</h2>
        <div className="bg-surface border border-secondary/10 rounded-xl divide-y divide-secondary/10">
          {activities.map((a) => (
            <div key={a.id} className="p-4">
              <div className="text-sm text-primary">{a.text}</div>
              <div className="text-xs text-secondary mt-1">
                {new Date(a.createdAt).toLocaleString()} {a.taskTitle ? `• ${a.taskTitle}` : ""}
              </div>
            </div>
          ))}
          {activities.length === 0 ? (
            <div className="p-4 text-secondary">No recent activity.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}