import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { type Priority } from "../../api"

const styles = {
  basePill: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-sm transition-colors focus:outline-none focus:ring-2",
  nonePill: "bg-board text-primary border border-secondary/20 focus:ring-secondary/30",
  Low: "bg-green-500 text-white focus:ring-green-200",
  Medium: "bg-amber-500 text-white focus:ring-amber-200",
  High: "bg-rose-500 text-white focus:ring-rose-200",
  Urgent: "bg-red-600 text-white focus:ring-red-200",
  dot: "w-2.5 h-2.5 rounded-full",
  LowDot: "bg-green-200",
  MediumDot: "bg-amber-200",
  HighDot: "bg-rose-200",
  UrgentDot: "bg-red-200",
}

const OPTIONS: Priority[] = ["Low", "Medium", "High", "Urgent"]

export default function PrioritySelect({
  value,
  onChange,
  className = "",
}: {
  value: Priority | null | undefined
  onChange: (next: Priority | null) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const pillClass =
    styles.basePill +
    " " +
    (value ? (styles as any)[value] : styles.nonePill) +
    (className ? " " + className : "")

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current || !btnRef.current) return
      if (menuRef.current.contains(e.target as Node)) return
      if (btnRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveIndex(Math.max(0, OPTIONS.findIndex(p => p === value)))
  }, [open, value])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className={pillClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {value ? (
          <>
            <span className={`${styles.dot} ${(styles as any)[`${value}Dot`]}`} />
            <span>{value}</span>
          </>
        ) : (
          <span>No priority</span>
        )}
        <ChevronDown className="w-4 h-4 opacity-80" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-2 w-48 rounded-lg border border-secondary/10 bg-surface shadow-lg py-1"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
            if (e.key === "ArrowDown") setActiveIndex(i => Math.min(OPTIONS.length, i + 1))
            if (e.key === "ArrowUp") setActiveIndex(i => Math.max(-1, i - 1))
            if (e.key === "Enter") {
              if (activeIndex === -1) onChange(null)
              else onChange(OPTIONS[activeIndex])
              setOpen(false)
            }
          }}
        >
          <button
            role="option"
            aria-selected={!value}
            className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded hover:bg-board ${activeIndex === -1 ? "bg-board" : ""}`}
            onMouseEnter={() => setActiveIndex(-1)}
            onClick={() => { onChange(null); setOpen(false) }}
          >
            <span className="text-secondary">No priority</span>
            {!value && <Check className="w-4 h-4" />}
          </button>
          <div className="my-1 h-px bg-secondary/10" />
          {OPTIONS.map((p, i) => (
            <button
              key={p}
              role="option"
              aria-selected={value === p}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded hover:bg-board ${activeIndex === i ? "bg-board" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => { onChange(p); setOpen(false) }}
            >
              <span className="inline-flex items-center gap-2">
                <span className={`${styles.dot} ${(styles as any)[`${p}Dot`]}`} />
                <span className={
                  p === "Low" ? "text-green-700" :
                  p === "Medium" ? "text-amber-700" :
                  p === "High" ? "text-rose-700" :
                  "text-red-700"
                }>{p}</span>
              </span>
              {value === p && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}