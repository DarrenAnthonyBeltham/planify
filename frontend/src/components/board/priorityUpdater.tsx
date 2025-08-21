import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateTaskPriority, type Priority } from "../../api";
import { Check, ChevronDown } from "lucide-react";

interface Props {
  task: {
    id: string | number;
    priority: Priority | null;
  };
}

const OPTIONS: Priority[] = ["Low", "Medium", "High", "Urgent"];

export function PriorityUpdater({ task }: Props) {
  const [currentPriority, setCurrentPriority] = useState<Priority | null>(task.priority);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePriorityChange = async (next: Priority | null) => {
    setIsOpen(false);
    setIsUpdating(true);
    try {
      const saved = await updateTaskPriority(String(task.id), next);
      setCurrentPriority(saved.priority ?? null);
    } catch (error) {
      console.error("Failed to update priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX };
    }
    return { top: 0, left: 0 };
  };

  return (
    <div className={isUpdating ? 'opacity-50' : ''}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-32 cursor-pointer rounded-md py-1 px-2 bg-surface border border-secondary/20 text-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm"
      >
        <span>{currentPriority || 'No priority'}</span>
        <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={getButtonPosition()}
          className="absolute z-50 w-48 bg-surface border border-secondary/20 rounded-md shadow-lg py-1"
        >
          <button onClick={() => handlePriorityChange(null)} className="w-full text-left flex items-center justify-between px-3 py-2 text-primary hover:bg-background">
            <span>No priority</span>
            {!currentPriority && <Check className="w-4 h-4 text-accent" />}
          </button>
          <div className="my-1 h-px bg-secondary/20" />
          {OPTIONS.map(p => (
            <button key={p} onClick={() => handlePriorityChange(p)} className="w-full text-left flex items-center justify-between px-3 py-2 text-primary hover:bg-background">
              <span>{p}</span>
              {currentPriority === p && <Check className="w-4 h-4 text-accent" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}