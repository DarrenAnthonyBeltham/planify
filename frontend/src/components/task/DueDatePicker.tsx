import { useEffect, useMemo, useRef, useState } from "react"
import { Calendar as CalIcon, ChevronLeft, ChevronRight, X } from "lucide-react"

function toDateOnlyString(v: string | null) {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toISOString().slice(0, 10)
}

function fromYMD(s: string) {
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10))
  return new Date(y, m - 1, d)
}

function fmtYMD(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function DueDatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (next: string | null) => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>(toDateOnlyString(value))
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSelected(toDateOnlyString(value)), [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const viewDate = useMemo(
    () => (selected ? fromYMD(selected) : new Date()),
    [selected]
  )
  const [cursor, setCursor] = useState<Date>(viewDate)

  useEffect(() => {
    if (!open) setCursor(viewDate)
  }, [open, viewDate])

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const startDow = monthStart.getDay()
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))

  const isToday = (d?: Date | null) => {
    if (!d) return false
    const t = new Date()
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    )
  }

  const isSelected = (d?: Date | null) =>
    !!d && selected && fmtYMD(d) === selected

  return (
    <div className="relative inline-flex items-center gap-2" ref={anchorRef}>
      <label className="text-sm font-semibold text-secondary">Due date</label>
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-secondary/20 text-primary"
        onClick={() => setOpen((o) => !o)}
      >
        <CalIcon className="w-4 h-4 text-accent" />
        <span className="text-sm">
          {selected || "Set date"}
        </span>
      </button>
      {selected && (
        <button
          className="ml-1 text-secondary hover:text-primary"
          onClick={async () => {
            setSelected("")
            await onChange(null)
          }}
          aria-label="Clear due date"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="absolute top-full mt-2 z-50 bg-surface rounded-xl shadow-xl border border-secondary/20 p-3 w-80">
          <div className="flex items-center justify-between mb-2">
            <button
              className="p-2 rounded-md hover:bg-board"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-primary">
              {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button
              className="p-2 rounded-md hover:bg-board"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-secondary mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <button
                key={i}
                disabled={!d}
                onClick={async () => {
                  if (!d) return
                  const ymd = fmtYMD(d)
                  setSelected(ymd)
                  await onChange(ymd)
                  setOpen(false)
                }}
                className={[
                  "h-9 rounded-md text-sm flex items-center justify-center",
                  !d ? "invisible" : "hover:bg-board",
                  isToday(d) && !isSelected(d) ? "ring-1 ring-accent/50" : "",
                  isSelected(d) ? "bg-accent text-white hover:bg-accent" : ""
                ].join(" ")}
              >
                {d?.getDate()}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="text-sm text-secondary hover:text-primary"
              onClick={async () => {
                setSelected("")
                await onChange(null)
                setOpen(false)
              }}
            >
              Clear
            </button>
            <button
              className="text-sm text-accent hover:underline"
              onClick={async () => {
                const t = new Date()
                const ymd = fmtYMD(t)
                setSelected(ymd)
                await onChange(ymd)
                setCursor(t)
                setOpen(false)
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
