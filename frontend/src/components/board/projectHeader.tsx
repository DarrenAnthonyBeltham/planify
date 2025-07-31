export function ProjectHeader({ project }: { project: any }) {
  const teamMembers = project.team || [];
  
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-primary">{project.name}</h1>
      <p className="text-secondary max-w-3xl my-4">{project.description}</p>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center -space-x-2">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="relative group">
                <img className="w-8 h-8 rounded-full border-2 border-surface" src={member.avatar} alt={member.name} title={member.name} />
                <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
              </div>
            ))}
          </div>
          <button className="ml-2 w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30">+</button>
        </div>
      </div>
    </div>
  );
}