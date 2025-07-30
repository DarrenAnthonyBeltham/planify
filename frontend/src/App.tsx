import { useEffect } from "react";
import { usedTimeBasedTheme } from "./hooks/usedTimeBasedTheme";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/Homepage";

function App() {
  const theme = usedTimeBasedTheme();

  useEffect(() => {
    console.log("Current theme from hook:", theme); 
    const root = document.documentElement;
    root.classList.remove("theme-morning", "theme-afternoon", "theme-night", "theme-dawn");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="bg-background text-primary min-h-screen font-sans">
      <AppLayout>
        <HomePage />
      </AppLayout>
    </div>
  );
}

export default App;
