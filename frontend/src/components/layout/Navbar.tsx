import { useEffect, useMemo, useRef, useState } from "react"
import { Menu, PlusCircle, Search, FolderClosed, CheckSquare, User as UserIcon } from "lucide-react"
import { fetchProjects, fetchMyTasks, searchUsers } from "../../api"

interface NavbarProps {
  onMenuClick: () => void
  onNewProjectClick: () => void
}

type ProjectItem = { kind: "project"; id: number; title: string; subtitle?: string; href: string }
type TaskItem = { kind: "task"; id: number; title: string; subtitle?: string; href: string }
type UserItem = { kind: "user"; id: number; title: string; subtitle?: string; href: string; avatar?: string | null }
type ResultItem = ProjectItem | TaskItem | UserItem

export function Navbar({ onMenuClick, onNewProjectClick }: NavbarProps) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ projects: ProjectItem[]; tasks: TaskItem[]; users: UserItem[] }>({ projects: [], tasks: [], users: [] })
  const [active, setActive] = useState<number>(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResults({ projects: [], tasks: [], users: [] })
      setActive(-1)
      return
    }
    const handle = setTimeout(async () => {
      setLoading(true)
      try {
        const [projects, tasks, users] = await Promise.all([
          fetchProjects().catch(() => []),
          fetchMyTasks().catch(() => []),
          searchUsers(q).catch(() => []),
        ])
        const qq = q.toLowerCase()
        const projItems: ProjectItem[] = (projects || [])
          .filter((p: any) => p.name.toLowerCase().includes(qq) || (p.description || "").toLowerCase().includes(qq))
          .slice(0, 6)
          .map((p: any) => ({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `#/project/${p.id}` }))

        const taskItems: TaskItem[] = (tasks || [])
          .filter((t: any) => t.title.toLowerCase().includes(qq) || (t.projectName || "").toLowerCase().includes(qq))
          .slice(0, 8)
          .map((t: any) => ({ kind: "task", id: t.id, title: t.title, subtitle: t.projectName, href: `#/task/${t.id}` }))

        const userItems: UserItem[] = (users || [])
          .slice(0, 8)
          .map((u: any) => ({ kind: "user", id: u.id, title: u.name || u.email, subtitle: u.email, avatar: u.avatar || null, href: `#/user/${u.id}` }))

        setResults({ projects: projItems, tasks: taskItems, users: userItems })
        setActive(-1)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [q])

  const flatResults = useMemo<ResultItem[]>(() => [...results.projects, ...results.tasks, ...results.users], [results])

  const goTo = (item: ResultItem | undefined) => {
    if (!item) return
    window.location.hash = item.href
    setOpen(false)
    setQ("")
  }

  return (
    <nav className="bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-secondary/10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <button onClick={onMenuClick} className="mr-4 text-primary"><Menu size={24} /></button>

        <div className="relative flex-1 max-w-xl" ref={boxRef}>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-5 h-5 text-secondary" /></span>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open) return
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flatResults.length - 1)) }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
              else if (e.key === "Enter") { e.preventDefault(); goTo(flatResults[active]) }
              else if (e.key === "Escape") { setOpen(false) }
            }}
            className="w-full py-2 pl-10 pr-4 text-primary bg-surface border border-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search projects, tasks, people…"
          />

          {open && q.trim() && (
            <div className="absolute mt-2 w-full rounded-xl border border-secondary/15 bg-surface shadow-lg overflow-hidden">
              {loading && <div className="px-4 py-3 text-sm text-secondary">Searching…</div>}
              {!loading && flatResults.length === 0 && <div className="px-4 py-3 text-sm text-secondary">No results</div>}

              {!loading && results.projects.length > 0 && (
                <div className="py-2">
                  <div className="px-3 pb-1 text-xs uppercase tracking-wide text-secondary">Projects</div>
                  {results.projects.map((item, idx) => {
                    const index = idx
                    const isActive = active === index
                    return (
                      <button key={`p-${item.id}`} onMouseEnter={() => setActive(index)} onClick={() => goTo(item)} className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}>
                        <FolderClosed className="w-4 h-4 text-secondary" />
                        <div className="min-w-0">
                          <div className="text-sm text-primary truncate">{item.title}</div>
                          {item.subtitle ? <div className="text-xs text-secondary truncate">{item.subtitle}</div> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {!loading && results.tasks.length > 0 && (
                <div className="py-2 border-t border-secondary/10">
                  <div className="px-3 pb-1 text-xs uppercase tracking-wide text-secondary">Tasks</div>
                  {results.tasks.map((item, idx) => {
                    const index = results.projects.length + idx
                    const isActive = active === index
                    return (
                      <button key={`t-${item.id}`} onMouseEnter={() => setActive(index)} onClick={() => goTo(item)} className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}>
                        <CheckSquare className="w-4 h-4 text-secondary" />
                        <div className="min-w-0">
                          <div className="text-sm text-primary truncate">{item.title}</div>
                          {item.subtitle ? <div className="text-xs text-secondary truncate">{item.subtitle}</div> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {!loading && results.users.length > 0 && (
                <div className="py-2 border-t border-secondary/10">
                  <div className="px-3 pb-1 text-xs uppercase tracking-wide text-secondary">People</div>
                  {results.users.map((item, idx) => {
                    const index = results.projects.length + results.tasks.length + idx
                    const isActive = active === index
                    return (
                      <button key={`u-${item.id}`} onMouseEnter={() => setActive(index)} onClick={() => goTo(item)} className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}>
                        {item.avatar ? <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" /> : <UserIcon className="w-4 h-4 text-secondary" />}
                        <div className="min-w-0">
                          <div className="text-sm text-primary truncate">{item.title}</div>
                          {item.subtitle ? <div className="text-xs text-secondary truncate">{item.subtitle}</div> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <button onClick={onNewProjectClick} className="flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity ml-4">
            <PlusCircle size={20} />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </nav>
  )
}