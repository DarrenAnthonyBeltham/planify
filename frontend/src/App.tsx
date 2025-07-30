import { useEffect } from "react";
import { HomePage } from "./pages/Homepage";
import { usedTimeBasedTheme } from "./hooks/usedTimeBasedTheme";

function App() {
  const theme = usedTimeBasedTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-sunny", "theme-afternoon", "theme-night", "theme-dawn");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="bg-background text-primary min-h-screen font-sans">
      <main>
        <HomePage />
      </main>
    </div>
  );
}

export default App;