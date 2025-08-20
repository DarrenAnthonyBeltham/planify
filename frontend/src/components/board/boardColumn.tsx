import { useState, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

export function BoardColumn({
  column,
  onAddTask,
  children
}: {
  column: any;
  onAddTask: (statusId: string | number, title: string) => Promise<void> | void;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: String(column.id) });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <div className="w-[360px] shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{column.title}</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-surface text-secondary">{column.tasks?.length ?? 0}</span>
        </div>
      </div>
      <div ref={setNodeRef} className="space-y-3 min-h-[40px]">
        {children}
      </div>
      {!adding ? (
        <button
          className="mt-3 text-secondary hover:text-primary hover:underline text-sm"
          onClick={() => setAdding(true)}
        >
          + Add a card
        </button>
      ) : (
        <div className="mt-3 bg-surface shadow rounded-lg p-2">
          <input
            autoFocus
            className="w-full px-3 py-2 rounded border border-secondary/30 bg-background"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const t = title.trim();
                if (!t) return;
                onAddTask(column.id, t);
                setTitle("");
                setAdding(false);
              }
              if (e.key === 'Escape') {
                setTitle("");
                setAdding(false);
              }
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 rounded bg-accent text-on-accent disabled:opacity-50"
              disabled={!title.trim()}
              onClick={async () => {
                const t = title.trim();
                if (!t) return;
                await onAddTask(column.id, t);
                setTitle("");
                setAdding(false);
              }}
            >
              Add Card
            </button>
            <button
              className="px-3 py-1 rounded hover:bg-background"
              onClick={() => {
                setTitle("");
                setAdding(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}