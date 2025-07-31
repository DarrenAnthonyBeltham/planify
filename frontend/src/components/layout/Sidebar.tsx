import { Home, CheckSquare, Bell, Settings, X, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/authContext";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth(); 
  const links = [
    { name: 'Dashboard', icon: <Home size={20} />, active: true },
    { name: 'My Tasks', icon: <CheckSquare size={20} />, active: false },
    { name: 'Notifications', icon: <Bell size={20} />, active: false },
    { name: 'Settings', icon: <Settings size={20} />, active: false },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose}></div>

      <aside className={`w-64 bg-surface flex-shrink-0 p-5 flex flex-col border-r border-secondary/10 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className='flex justify-between items-center mb-10'>
            <div className='text-2xl font-bold text-accent'>Planify</div>
            <button onClick={onClose} className='text-secondary hover:text-primary'><X size={20} /></button>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          {links.map((link) => (
            <a key={link.name} href="#"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                link.active
                  ? "bg-accent text-white shadow-lg"
                  : "text-secondary hover:bg-accent/10 hover:text-primary"
              } transition-colors duration-200`}
            > {link.icon} <span className="font-medium">{link.name}</span> </a>
          ))}
        </nav>

        <div className='mt-auto'>
            <div className="flex items-center gap-3 p-2 rounded-lg">
                <img src="" className="w-10 h-10 rounded-full" 
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = " ";
                }}/>

                <div>
                    <p className="font-semibold text-primary text-sm">Darren</p>
                    <a href="#" className="text-xs text-secondary hover:text-accent">View Profile</a>
                </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-accent/10 hover:text-primary transition-colors duration-200">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
}
