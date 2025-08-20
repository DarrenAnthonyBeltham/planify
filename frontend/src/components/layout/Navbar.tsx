import { useEffect, useMemo, useRef, useState } from "react"
import { Menu, PlusCircle, Search, User as UserIcon, Folder, ListChecks } from "lucide-react"
import { fetchProjects, fetchMyTasks, searchUsers } from "../../api"

type ProjectItem = { kind: "project"; id: number; title: string; subtitle?: string; href: string }
type TaskItem = { kind: "task"; id: number; title: string; subtitle?: string; href: string }
type UserItem = { kind: "user"; id: number; title: string; subtitle?: string; href: string; avatar?: string | null }
type ResultItem = ProjectItem | TaskItem | UserItem

interface NavbarProps {
  onMenuClick: () => void
  onNewProjectClick: () => void
}

export function Navbar({ onMenuClick, onNewProjectClick }: NavbarProps) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ projects: ProjectItem[]; tasks: TaskItem[]; users: UserItem[] }>({
    projects: [],
    tasks: [],
    users: []
  })
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResults({ projects: [], tasks: [], users: [] })
      setOpen(false)
      return
    }
    setLoading(true)
    Promise.allSettled([fetchProjects(), fetchMyTasks(), searchUsers(q)])
      .then(([pRes, tRes, uRes]) => {
        const projects: ProjectItem[] =
          pRes.status === "fulfilled"
            ? pRes.value
                .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 5)
                .map((p) => ({ kind: "project", id: p.id, title: p.name, subtitle: p.description, href: `#/project/${p.id}` }))
            : []
        const tasks: TaskItem[] =
          tRes.status === "fulfilled"
            ? tRes.value
                .filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 5)
                .map((t) => ({
                  kind: "task",
                  id: t.id,
                  title: t.title,
                  subtitle: `${t.projectName} • ${t.statusName}`,
                  href: `#/task/${t.id}`
                }))
            : []
        const users: UserItem[] =
          uRes.status === "fulfilled"
            ? uRes.value.slice(0, 5).map((u) => ({
                kind: "user",
                id: u.id,
                title: u.name,
                subtitle: u.email,
                href: `#/user/${u.id}`,
                avatar: u.avatar ?? null
              }))
            : []
        setResults({ projects, tasks, users })
        setActive(0)
        setOpen(true)
      })
      .finally(() => setLoading(false))
  }, [q])

  const flat: ResultItem[] = useMemo(() => [...results.projects, ...results.tasks, ...results.users], [results])

  function goTo(item: ResultItem) {
    location.hash = item.href
    setOpen(false)
    setQ("")
  }

  return (
    <nav className="bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-secondary/10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <button onClick={onMenuClick} className="mr-4 text-primary">
          <Menu size={24} />
        </button>
        <div className="relative flex-1 max-w-xl" ref={boxRef}>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-secondary" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q && setOpen(true)}
            onKeyDown={(e) => {
              if (!open) return
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === "Enter") {
                e.preventDefault()
                const item = flat[active]
                if (item) goTo(item)
              } else if (e.key === "Escape") {
                setOpen(false)
              }
            }}
            type="text"
            className="w-full py-2 pl-10 pr-4 text-primary bg-surface border border-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search tasks, projects, people…"
          />
          {open && (
            <div className="absolute mt-2 w-full bg-surface border border-secondary/20 rounded-lg shadow-lg overflow-hidden">
              {loading ? <div className="px-3 py-2 text-secondary text-sm">Searching…</div> : null}

              {!loading && results.projects.length > 0 && (
                <div className="py-2">
                  <div className="px-3 pb-1 text-xs uppercase tracking-wide text-secondary">Projects</div>
                  {results.projects.map((item, idx) => {
                    const index = idx
                    const isActive = active === index
                    return (
                      <button
                        key={`p-${item.id}`}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => goTo(item)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}
                      >
                        <Folder className="w-4 h-4 text-secondary" />
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
                      <button
                        key={`t-${item.id}`}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => goTo(item)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}
                      >
                        <ListChecks className="w-4 h-4 text-secondary" />
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
                      <button
                        key={`u-${item.id}`}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => goTo(item)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-3 ${isActive ? "bg-board" : ""}`}
                      >
                        {item.avatar ? (
                          <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-secondary" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm text-primary truncate">{item.title}</div>
                          {item.subtitle ? <div className="text-xs text-secondary truncate">{item.subtitle}</div> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {!loading && flat.length === 0 ? <div className="px-3 py-2 text-secondary text-sm">No results</div> : null}
            </div>
          )}
        </div>
        <div>
          <button
            onClick={onNewProjectClick}
            className="flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity ml-4"
          >
            <PlusCircle size={20} />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </nav>
  )
}