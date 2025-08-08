import { useEffect, useState } from "react";
import { HomePage } from "../pages/Homepage";
import { ProjectPage } from "../pages/ProjectPage";
import { MyTasksPage } from "../pages/MyTasksPage";
import { TaskPage } from "../pages/TaskPage";
import { LoginPage } from "../pages/LoginPage";
import { useAuth } from "../contexts/authContext";

export function Router() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  const { token } = useAuth();

  useEffect(() => {
    const h = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const path = (hash || "#/").replace(/^#\/?/, "");
  const parts = path.split("/");

  if (parts[0] === "login") {
    return token ? <HomePage /> : <LoginPage />;
  }

  if (!token) return <LoginPage />;

  if (parts[0] === "task" && parts[1]) return <TaskPage taskId={parts[1]} />;
  if (parts[0] === "project" && parts[1]) return <ProjectPage projectId={parts[1]} />;
  if (parts[0] === "mytasks") return <MyTasksPage />;
  return <HomePage />;
}
