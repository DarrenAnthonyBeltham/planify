import { Menu, PlusCircle, Search } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
  onNewProjectClick: () => void;
}

export function Navbar({ onMenuClick, onNewProjectClick }: NavbarProps) {
  return (
    <nav className='bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-secondary/10'>
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <button onClick={onMenuClick} className="mr-4 text-primary"><Menu size={24} /></button>
        <div className="relative flex-1 max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-5 h-5 text-secondary" /></span>
          <input type="text" className="w-full py-2 pl-10 pr-4 text-primary bg-surface border border-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Search tasks, projects, etc..." />
        </div>
        <div>
          <button onClick={onNewProjectClick} className="flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity ml-4">
            <PlusCircle size={20} />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </nav>
  );
}