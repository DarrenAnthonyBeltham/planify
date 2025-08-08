import { useState, useEffect, useRef } from 'react'
import { Calendar, Plus, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { updateProjectDueDate } from '../../api'

export function ProjectHeader({
  project,
  onUpdate,
}: {
  project: any
  onUpdate: (updated: any) => void
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(
    project.due_date ? new Date(project.due_date) : new Date()
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    project.due_date ? new Date(project.due_date) : null
  )
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  useEffect(() => {
    setSelectedDate(project.due_date ? new Date(project.due_date) : null)
    setCurrentDate(project.due_date ? new Date(project.due_date) : new Date())
  }, [project.due_date])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false)
        setShowMonthPicker(false)
        setShowYearPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const y = date.getFullYear()
    const m = date.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const daysInMonth = last.getDate()
    const startDow = first.getDay()
    const arr: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(y, m, d))
    return arr
  }

  const handleDaySelect = async (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    setIsPickerOpen(false)
    const newDate = format(date, 'yyyy-MM-dd')
    try {
      await updateProjectDueDate(project.id, newDate)
      onUpdate({ ...project, due_date: newDate })
    } catch {}
  }

  const handleRemoveDate = async () => {
    setSelectedDate(null)
    setIsPickerOpen(false)
    try {
      await updateProjectDueDate(project.id, null)
      onUpdate({ ...project, due_date: null })
    } catch {}
  }

  const handleSetToday = () => handleDaySelect(new Date())
  const navigateMonth = (dir: number) =>
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
  const handleMonthSelect = (mi: number) => {
    setCurrentDate(d => new Date(d.getFullYear(), mi, 1))
    setShowMonthPicker(false)
  }
  const handleYearSelect = (y: number) => {
    setCurrentDate(d => new Date(y, d.getMonth(), 1))
    setShowYearPicker(false)
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const t = new Date()
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    )
  }
  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const teamMembers = project.team || []
  const days = getDaysInMonth(currentDate)

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-primary">{project.name}</h1>
      <p className="text-secondary max-w-3xl my-4 text-base leading-relaxed">
        {project.description}
      </p>
      <div className="flex items-center justify-between mt-6">
        <div className="relative">
          <button
            onClick={() => setIsPickerOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-secondary transition text-secondary"
          >
            <Calendar size={16} className="text-accent" />
            <span className="font-medium">
              {selectedDate
                ? `Due: ${format(selectedDate, 'MM/dd/yyyy')}`
                : 'Set Due Date'}
            </span>
          </button>
          {isPickerOpen && (
            <div
              ref={pickerRef}
              className="absolute top-full mt-2 z-50 bg-surface rounded-lg shadow-lg border border-secondary overflow-visible"
              style={{ minWidth: 360 }}
            >
              <div className="flex items-center justify-between px-4 py-2 bg-accent text-white">
                <button onClick={() => navigateMonth(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMonthPicker(m => !m)
                        setShowYearPicker(false)
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10"
                    >
                      <span className="text-sm font-medium">{months[currentDate.getMonth()]}</span>
                      <ChevronDown size={14} className="align-middle" />
                    </button>
                    {showMonthPicker && (
                      <div className="absolute top-full right-0 mt-1 bg-surface border border-secondary rounded-lg shadow-md w-48 max-h-64 overflow-auto">
                        <div className="grid grid-cols-3 gap-1 p-2">
                          {months.map((m, i) => (
                            <button
                              key={i}
                              onClick={() => handleMonthSelect(i)}
                              className={`px-2 py-1 text-sm rounded ${
                                i === currentDate.getMonth()
                                  ? 'bg-accent text-white'
                                  : 'hover:bg-board'
                              }`}
                            >
                              {m.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowYearPicker(y => !y)
                        setShowMonthPicker(false)
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10"
                    >
                      <span className="text-sm font-medium">{currentDate.getFullYear()}</span>
                      <ChevronDown size={14} className="align-middle" />
                    </button>
                    {showYearPicker && (
                      <div className="absolute top-full right-0 mt-1 bg-surface border border-secondary rounded-lg shadow-md w-48 max-h-64 overflow-auto">
                        <div className="grid grid-cols-4 gap-1 p-2">
                          {years.map(y => (
                            <button
                              key={y}
                              onClick={() => handleYearSelect(y)}
                              className={`px-2 py-1 text-sm rounded ${
                                y === currentDate.getFullYear()
                                  ? 'bg-accent text-white'
                                  : 'hover:bg-board'
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => navigateMonth(1)}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map((d, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-secondary">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => date && handleDaySelect(date)}
                      disabled={!date}
                      className={`h-10 w-10 rounded text-sm flex items-center justify-center transition ${
                        !date ? 'invisible' : ''
                      } ${
                        isSelected(date)
                          ? 'bg-accent text-white'
                          : isToday(date)
                          ? 'bg-accent/10 text-accent'
                          : 'hover:bg-board'
                      }`}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-board border-t border-secondary">
                <button onClick={() => setIsPickerOpen(false)} className="text-secondary">
                  Cancel
                </button>
                <div className="flex gap-2">
                  {selectedDate && (
                    <button onClick={handleRemoveDate} className="text-red-600">
                      Remove
                    </button>
                  )}
                  <button onClick={handleSetToday} className="bg-accent text-white px-2 py-1 rounded">
                    Today
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {teamMembers.map((m: any) => (
              <div key={m.id} className="relative group">
                <img
                  src={m.avatar}
                  alt={m.name}
                  title={m.name}
                  className="w-8 h-8 rounded-full border-2 border-surface"
                />
                <button className="absolute inset-0 bg-red-500/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button className="w-8 h-8 rounded-full bg-surface border-2 border-dashed border-accent flex items-center justify-center">
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}