import { Home, CheckSquare, Settings, X, LogOut, User } from "lucide-react"
import { useAuth } from "../../contexts/authContext"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth()
  const links = [
    { name: "Dashboard", href: "#/", icon: <Home size={20} /> },
    { name: "My Tasks", href: "#/mytasks", icon: <CheckSquare size={20} /> },
    { name: "Profile", href: "#/profile", icon: <User size={20} /> },
    { name: "Settings", href: "#/settings", icon: <Settings size={20} /> },
  ]
  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose}></div>
      <aside className={`w-64 bg-surface flex-shrink-0 p-5 flex flex-col border-r border-secondary/10 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center mb-10">
          <div className="text-2xl font-bold text-accent">Planify</div>
          <button onClick={onClose} className="text-secondary hover:text-primary"><X size={20} /></button>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          {links.map((l) => (
            <a key={l.name} href={l.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-accent/10 hover:text-primary transition-colors duration-200">
              {l.icon}
              <span className="font-medium">{l.name}</span>
            </a>
          ))}
        </nav>
        <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-accent/10 hover:text-primary transition-colors duration-200">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>
    </>
  )
}
