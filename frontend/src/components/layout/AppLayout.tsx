import { useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import Footer from "./Footer";
import { CreateProjectModal } from "../modals/createProjectModal";

export function AppLayout({ children, onProjectCreated }: { children: ReactNode, onProjectCreated: (project: any) => void }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} onNewProjectClick={() => setCreateModalOpen(true)} />
        <main className="flex-grow">
          <div className="container mx-auto px-6">{children}</div>
        </main>
        <Footer />
      </div>
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={onProjectCreated}
      />
    </div>
  );
}