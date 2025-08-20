import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchSettings, updateSettings, type UserSettings } from '../api';
import { useAuth } from './authContext';

type SettingsContextType = {
  settings: UserSettings | null;
  loading: boolean;
  updateTheme: (theme: UserSettings['appearanceTheme']) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchSettings()
        .then(setSettings)
        .catch(() => console.error("Failed to fetch settings"))
        .finally(() => setLoading(false));
    } else {
      setSettings(null);
    }
  }, [token]);
  
  const updateTheme = async (theme: UserSettings['appearanceTheme']) => {
    if (!settings) return;
    const optimisticUpdate = { ...settings, appearanceTheme: theme };
    setSettings(optimisticUpdate);
    try {
        await updateSettings({ appearanceTheme: theme });
    } catch {
        setSettings(settings); // Revert on failure
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}