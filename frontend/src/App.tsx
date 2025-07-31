import { useEffect } from "react";
import { usedTimeBasedTheme } from "./hooks/usedTimeBasedTheme";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./contexts/authContext";
import { LoginPage } from "./pages/LoginPage";
import { Router } from "./components/Router";

function App() {
  const theme = usedTimeBasedTheme();
  const { token } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-morning", "theme-afternoon", "theme-night", "theme-dawn");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div className="bg-background text-primary min-h-screen font-sans">
      <AppLayout>
        <Router />
      </AppLayout>
    </div>
  );
}

export default App;
