import { useState, useEffect } from "react";
import { HomePage } from "../pages/Homepage";
import { ProjectPage } from "../pages/ProjectPage";
import { MyTasksPage } from "../pages/MyTasksPage";
import { TaskPage } from "../pages/TaskPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { UserProfilePage } from "../pages/userProfilePages";
import { SettingsPage } from "../pages/SettingsPage";
import { useAuth } from "../contexts/authContext";
import { AnimatedPage } from "./AnimatedPage";

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

  const renderPage = () => {
    if (parts[0] === "login") return token ? <HomePage /> : <LoginPage />;
    if (!token) return <LoginPage />;
    if (!parts[0] || parts[0] === "") return <HomePage />;
    if (parts[0] === "mytasks") return <MyTasksPage />;
    if (parts[0] === "project" && parts[1]) return <ProjectPage projectId={parts[1]} />;
    if (parts[0] === "task" && parts[1]) return <TaskPage taskId={parts[1]} />;
    if (parts[0] === "profile") return <ProfilePage />;
    if (parts[0] === "user" && parts[1]) return <UserProfilePage userId={parts[1]} />;
    if (parts[0] === "settings") return <SettingsPage />;
    return <HomePage />;
  };

  return <AnimatedPage>{renderPage()}</AnimatedPage>;
}