import { useEffect, useState } from "react";
import {
  fetchProjects,
  fetchMyTasks,
  fetchMySummary,
  getMe,
  type Project,
  type UserTask,
  type UserSummary,
  type User,
} from "../api";
import { ProjectCard } from "../components/board/projectCards";
import { Briefcase, CheckCircle, MessageSquare, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMe(),
      fetchProjects(),
      fetchMyTasks(),
      fetchMySummary(),
    ])
      .then(([userData, projectData, taskData, summaryData]) => {
        setUser(userData);
        setProjects(projectData);
        setTasks(taskData);
        setSummary(summaryData);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-8 animate-pulse">
        <div className="h-8 w-1/3 bg-surface rounded-md mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-48 bg-surface rounded-xl"></div>
            <div className="h-64 bg-surface rounded-xl"></div>
          </div>
          <div className="h-96 bg-surface rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;

  return (
    <div className="py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8">
        Welcome back, {user?.name.split(" ")[0] || "User"}!
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-semibold text-primary">Your Projects</h2>
            </div>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-xl p-8 text-center text-secondary">
                  <h3 className="text-lg font-semibold text-primary">No projects yet!</h3>
                  <p className="mt-2">Create your first project to get started.</p>
                  <button className="mt-4 flex items-center gap-2 bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity mx-auto">
                    <PlusCircle size={20} />
                    <span>New Project</span>
                  </button>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-semibold text-primary">Recent Activity</h2>
            </div>
            <div className="bg-surface rounded-xl p-4 space-y-4">
              {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                summary.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-2">
                     <div className="w-2 h-2 mt-2 rounded-full bg-accent shrink-0" />
                     <div className="flex-1">
                        <p className="text-primary leading-tight">
                          You commented: "{activity.text}"
                        </p>
                        <span className="text-xs text-secondary">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })} on task "{activity.taskTitle}"
                        </span>
                     </div>
                  </div>
                ))
              ) : (
                <p className="text-secondary text-center py-4">No recent activity to show.</p>
              )}
            </div>
          </section>
        </main>

        <aside className="lg:col-span-1">
          <section className="bg-surface rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-semibold text-primary">My Tasks</h2>
            </div>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.slice(0, 7).map((task) => (
                  <a key={task.id} href={`#/task/${task.id}`} className="block p-3 rounded-lg hover:bg-background transition-colors">
                    <p className="font-medium text-primary">{task.title}</p>
                    <span className="text-sm text-secondary">{task.projectName}</span>
                  </a>
                ))
              ) : (
                <p className="text-secondary text-center py-4">You have no assigned tasks.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}