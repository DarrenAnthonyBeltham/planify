import { useEffect, useMemo, useState } from "react";
import { changePassword, getMe, updateMe, uploadAvatar, type User } from "../api";
import { Briefcase, Calendar, Edit3, Lock, Mail, MessageSquare, Users } from "lucide-react";

type Summary = {
  assignedCount: number;
  collaboratorCount: number;
  commentCount: number;
  projectCount: number;
  recentActivity: Array<{ id: number; text: string; createdAt: string; taskTitle?: string }>;
};

type LiteProject = { id: number; name: string; dueDate?: string | null; description?: string | null };

function normalizeAvatarUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api";
  const origin = base.replace(/\/api\/?$/, "");
  return url.startsWith("/") ? origin + url : origin + "/" + url;
}

async function fetchOptional<T>(path: string): Promise<T | null> {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api";
  const token = localStorage.getItem("planify_token");
  try {
    const r = await fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<LiteProject[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const me = await getMe();
        if (!mounted) return;
        setUser(me);
        setName(me.name || "");
        setEmail(me.email || "");
        const stored = localStorage.getItem("planify_avatar_url");
        const next = normalizeAvatarUrl(me.avatar || stored);
        setAvatar(next || "https://placehold.co/160x160?text=User");
        const [s, p] = await Promise.all([
          fetchOptional<Summary>("/me/summary"),
          fetchOptional<LiteProject[]>("/me/projects"),
        ]);
        if (!mounted) return;
        setSummary(s);
        setProjects(p);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to fetch user");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const uploadNewAvatar = async (file: File) => {
    setError(null); setNotice(null);
    try {
      const { url } = await uploadAvatar(file);
      setAvatar(normalizeAvatarUrl(url) || url);
      localStorage.setItem("planify_avatar_url", url);
      setTimeout(() => setAvatar(u => (u ? `${u.split("?")[0]}?t=${Date.now()}` : u)), 60);
      setNotice("Avatar updated");
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar");
    }
  };

  const stats = useMemo(() => {
    return {
      tasks: summary?.assignedCount ?? 0,
      collabs: summary?.collaboratorCount ?? 0,
      comments: summary?.commentCount ?? 0,
      projects: summary?.projectCount ?? (projects?.length ?? 0),
    };
  }, [summary, projects]);

  if (loading) {
    return (
      <div className="py-8 animate-pulse space-y-6">
        <div className="h-36 rounded-2xl bg-surface" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-56 rounded-xl bg-surface" />
            <div className="h-56 rounded-xl bg-surface" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-xl bg-surface" />
            <div className="h-40 rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="py-4 md:py-8">
      <div className="relative h-36 md:h-44 rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-100 to-cyan-100 border border-secondary/10" />
      <div className="relative -mt-10 sm:-mt-12 px-4 md:px-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-background overflow-hidden bg-surface shrink-0">
            <img
              src={avatar || "https://placehold.co/160x160?text=User"}
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = "https://placehold.co/160x160?text=User")}
            />
          </div>
          <div className="flex-1">
            <div className="text-2xl md:text-3xl font-bold text-primary">{name || "User"}</div>
            <div className="flex items-center gap-2 text-secondary">
              <Mail className="w-4 h-4" />
              <span>{email}</span>
            </div>
          </div>
          <label className="px-3 py-2 rounded-md border border-secondary/20 hover:bg-surface cursor-pointer text-sm">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await uploadNewAvatar(f);
              }}
            />
            Change avatar
          </label>
        </div>
      </div>

      {notice && <div className="max-w-5xl mx-auto mt-4 p-3 bg-green-500/20 text-green-500 rounded">{notice}</div>}

      <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-secondary/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-4">
              <Edit3 className="w-4 h-4" />
              <span>Profile</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary">Name</label>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-background text-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-secondary">Email</label>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-background text-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                disabled={saving}
                className="px-4 py-2 rounded-md bg-accent text-on-accent font-semibold disabled:opacity-60"
                onClick={async () => {
                  setSaving(true);
                  setError(null); setNotice(null);
                  try {
                    const u = await updateMe({ name, email });
                    setUser(u);
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setNotice("Profile updated");
                  } catch (e: any) {
                    setError(e?.message || "Failed to update profile");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          <div className="bg-surface border border-secondary/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-4">
              <Briefcase className="w-4 h-4" />
              <span>Recent projects</span>
            </div>
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 6).map(p => (
                  <a key={p.id} href={`#/project/${p.id}`} className="block rounded-lg border border-secondary/10 bg-background p-4 hover:bg-white">
                    <div className="font-semibold text-primary">{p.name}</div>
                    <div className="mt-1 text-sm text-secondary line-clamp-2">{p.description || "No description"}</div>
                    {p.dueDate && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-secondary">
                        <Calendar className="w-3 h-3" />
                        <span>Due {new Date(p.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-secondary">No projects yet</div>
            )}
          </div>

          <div className="bg-surface border border-secondary/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-4">
              <MessageSquare className="w-4 h-4" />
              <span>Recent activity</span>
            </div>
            {summary?.recentActivity?.length ? (
              <div className="space-y-4">
                {summary.recentActivity.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-accent" />
                    <div className="flex-1">
                      <div className="text-primary">{a.text}</div>
                      <div className="text-xs text-secondary">
                        {a.taskTitle ? `on “${a.taskTitle}” • ` : ""}
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-secondary">No recent activity</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-secondary/10 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background p-4">
                <div className="text-xs text-secondary">Assigned</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{stats.tasks}</div>
              </div>
              <div className="rounded-lg bg-background p-4">
                <div className="text-xs text-secondary">Collaborating</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{stats.collabs}</div>
              </div>
              <div className="rounded-lg bg-background p-4">
                <div className="text-xs text-secondary">Comments</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{stats.comments}</div>
              </div>
              <div className="rounded-lg bg-background p-4">
                <div className="text-xs text-secondary">Projects</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{stats.projects}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-secondary">
              <Users className="w-4 h-4" />
              <span>{user?.name || "User"}</span>
            </div>
          </div>

          <div className="bg-surface border border-secondary/10 rounded-xl p-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-4">
              <Lock className="w-4 h-4" />
              <span>Security</span>
            </div>
            <label className="text-sm text-secondary">New password</label>
            <input
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-background text-primary"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <label className="mt-4 text-sm text-secondary">Confirm new password</label>
            <input
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-background text-primary"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            <button
              disabled={pwSaving || !pw || pw !== pw2}
              className="mt-4 px-4 py-2 rounded-md bg-accent text-on-accent font-semibold disabled:opacity-60 w-full"
              onClick={async () => {
                setPwSaving(true);
                setError(null); setNotice(null);
                try {
                  await changePassword(pw);
                  setPw(""); setPw2("");
                  setNotice("Password updated");
                } catch (e: any) {
                  setError(e?.message || "Failed to update password");
                } finally {
                  setPwSaving(false);
                }
              }}
            >
              {pwSaving ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}