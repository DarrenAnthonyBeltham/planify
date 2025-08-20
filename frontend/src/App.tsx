import { useEffect } from "react";
import { useSettings } from "./contexts/settingsContext";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./contexts/authContext";
import { LoginPage } from "./pages/LoginPage";
import { Router } from "./components/Router";
import { usedTimeBasedTheme, type Theme } from "./hooks/usedTimeBasedTheme";

function App() {
  const { token } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-morning", "theme-afternoon", "theme-night", "theme-dawn");

    let themeToApply: Theme | 'light' | 'dark' = 'morning';

    if (settings) {
        if (settings.appearanceTheme === 'Automatic') {
            themeToApply = usedTimeBasedTheme();
        } else if (settings.appearanceTheme === 'Dark') {
            themeToApply = 'night';
        } else {
            themeToApply = 'morning'; 
        }
    }
    
    root.classList.add(`theme-${themeToApply}`);
  }, [settings]);

  const handleProjectCreated = (newProject: any) => {
    window.location.hash = `#/project/${newProject.id}`;
  };

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div className="bg-background text-primary min-h-screen font-sans">
      <AppLayout onProjectCreated={handleProjectCreated}>
        <Router />
      </AppLayout>
    </div>
  );
}

export default App;