import { useState, useEffect, useRef } from "react";
import { updateSettings, type UserSettings } from "../api";
import { Bell, Palette, User, ChevronDown, Check } from "lucide-react";
import { useSettings } from "../contexts/settingsContext";

const SettingsCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-surface border border-secondary/20 rounded-xl">
    <div className="p-4 border-b border-secondary/20 flex items-center gap-3">
      {icon}
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-primary">{label}</div>
      <div className="text-sm text-secondary">{description}</div>
    </div>
    <button onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full flex items-center transition-colors ${checked ? 'bg-accent' : 'bg-surface border border-secondary/20'}`}>
      <span className={`inline-block w-5 h-5 bg-white rounded-full transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  return (
    <div className="flex items-center justify-between">
      <div className="font-medium text-primary">{label}</div>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-40 cursor-pointer rounded-md py-2 pl-3 pr-2 bg-surface border border-secondary/20 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <span>{value}</span>
          <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute top-full mt-2 w-40 z-10 bg-surface border border-secondary/20 rounded-md shadow-lg py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center justify-between px-3 py-2 text-primary hover:bg-background"
              >
                <span>{option}</span>
                {value === option && <Check className="w-4 h-4 text-accent" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export function SettingsPage() {
  const { settings: initialSettings, loading, updateTheme } = useSettings();
  const [settings, setSettings] = useState<UserSettings | null>(initialSettings);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const showSuccess = () => {
    setSuccessMessage("Settings saved successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleNotificationUpdate = async (updatedFields: Partial<UserSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updatedFields };
    setSettings(newSettings);
    try {
      await updateSettings(newSettings);
      showSuccess();
    } catch {
      setSettings(settings);
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center text-red-500">Could not load settings.</div>;

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-primary mb-8">Settings</h1>

      {successMessage && <div className="mb-4 p-3 bg-green-500/20 text-green-500 rounded-lg">{successMessage}</div>}

      <div className="space-y-8">
        <SettingsCard title="Notifications" icon={<Bell className="w-5 h-5 text-accent" />}>
          <Toggle
            label="When I'm assigned a task"
            description="Receive an email when a new task is assigned to you."
            checked={settings.notificationsAssign}
            onChange={(checked) => handleNotificationUpdate({ notificationsAssign: checked })}
          />
          <Toggle
            label="When a task is due soon"
            description="Get a reminder for tasks that are approaching their due date."
            checked={settings.notificationsDueDate}
            onChange={(checked) => handleNotificationUpdate({ notificationsDueDate: checked })}
          />
          <Toggle
            label="When someone comments on my tasks"
            description="Be notified about new comments on tasks you're involved in."
            checked={settings.notificationsComments}
            onChange={(checked) => handleNotificationUpdate({ notificationsComments: checked })}
          />
        </SettingsCard>

        <SettingsCard title="Appearance" icon={<Palette className="w-5 h-5 text-accent" />}>
          <Select
              label="Theme"
              value={settings.appearanceTheme}
              options={['Automatic', 'Light', 'Dark']}
              onChange={(theme) => {
                updateTheme(theme as UserSettings['appearanceTheme']);
                showSuccess();
              }}
          />
        </SettingsCard>
        
        <SettingsCard title="Account" icon={<User className="w-5 h-5 text-accent" />}>
           <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-primary">Export Data</div>
                  <div className="text-sm text-secondary">Download all your projects and tasks as a JSON file.</div>
                </div>
                <button className="px-4 py-2 rounded-md bg-surface border border-secondary/20 hover:bg-background text-sm font-semibold">
                  Export
                </button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-red-500">Delete Account</div>
                  <div className="text-sm text-secondary">Permanently delete your account and all of your data.</div>
                </div>
                <button className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">
                  Delete
                </button>
            </div>
        </SettingsCard>
      </div>
    </div>
  );
}