import { useEffect, useState } from "react"
import { changePassword, getMe, updateMe, uploadAvatar, type User } from "../api"

const PLACEHOLDER = "https://placehold.co/160x160?text=User"

function normalizeAvatarUrl(url?: string | null) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api"
  const origin = base.replace(/\/api\/?$/, "")
  return url.startsWith("/") ? origin + url : origin + "/" + url
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMe()
      .then((u: User) => {
        setName(u.name || "")
        setEmail(u.email || "")
        const stored = localStorage.getItem("planify_avatar_url")
        const next = normalizeAvatarUrl(u.avatar || stored)
        setAvatar(next)
      })
      .catch((e) => setError(e?.message || "Failed to fetch user"))
      .finally(() => setLoading(false))
  }, [])

  const uploadNewAvatar = async (file: File) => {
    setError(null); setNotice(null)
    try {
      const { url } = await uploadAvatar(file)
      setAvatar(url)
      localStorage.setItem("planify_avatar_url", url)
      setTimeout(() => setAvatar(u => (u ? `${u}?t=${Date.now()}` : u)), 100)
      setNotice("Avatar updated")
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar")
    }
  }

  if (loading) return <div className="p-8 text-center text-secondary">Loading profile…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="py-8 max-w-3xl">
      <h1 className="text-4xl font-bold text-primary mb-6">Profile</h1>

      {notice && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{notice}</div>}
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-surface border border-secondary/10 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-board overflow-hidden">
            <img
              src={avatar || PLACEHOLDER}
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
            />
          </div>
          <label className="px-3 py-2 rounded-md border border-secondary/20 hover:bg-board cursor-pointer text-sm">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) await uploadNewAvatar(f)
              }}
            />
            Change avatar
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-secondary">Name</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-secondary">Email</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            disabled={saving}
            className="px-4 py-2 rounded-md bg-accent text-white disabled:opacity-60"
            onClick={async () => {
              setSaving(true)
              try {
                const u: User = await updateMe({ name, email })
                setName(u.name || "")
                setEmail(u.email || "")
                setNotice("Profile updated")
              } catch (e: any) {
                setError(e?.message || "Failed to update profile")
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-secondary/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Change password</h2>
        <div className="max-w-md">
          <label className="text-sm text-secondary">New password</label>
          <input
            type="password"
            className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <label className="mt-4 text-sm text-secondary">Confirm new password</label>
          <input
            type="password"
            className="mt-1 w-full px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
          <button
            disabled={pwSaving || !pw || pw !== pw2}
            className="mt-4 px-4 py-2 rounded-md bg-accent text-white disabled:opacity-60"
            onClick={async () => {
              setPwSaving(true)
              try {
                await changePassword(pw)
                setPw("")
                setPw2("")
                setNotice("Password updated")
              } catch (e: any) {
                setError(e?.message || "Failed to update password")
              } finally {
                setPwSaving(false)
              }
            }}
          >
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </div>
  )
}