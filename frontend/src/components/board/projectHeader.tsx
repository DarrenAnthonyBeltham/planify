import { useState, useEffect, useRef } from 'react'
import { Calendar, Plus, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { updateProjectDueDate } from '../../api'

export function ProjectHeader({ project, onUpdate }: { project: any; onUpdate: (updated: any) => void }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(project.dueDate ? new Date(project.dueDate) : new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(project.dueDate ? new Date(project.dueDate) : null)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  useEffect(() => {
    setSelectedDate(project.dueDate ? new Date(project.dueDate) : null)
    setCurrentDate(project.dueDate ? new Date(project.dueDate) : new Date())
  }, [project.dueDate])

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
      const updated = await updateProjectDueDate(project.id, newDate)
      onUpdate({ ...project, ...updated, dueDate: newDate })
    } catch {}
  }

  const handleRemoveDate = async () => {
    setSelectedDate(null)
    setIsPickerOpen(false)
    try {
      const updated = await updateProjectDueDate(project.id, null)
      onUpdate({ ...project, ...updated, dueDate: null })
    } catch {}
  }

  const handleSetToday = () => handleDaySelect(new Date())
  const navigateMonth = (dir: number) => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
  const handleMonthSelect = (mi: number) => { setCurrentDate(d => new Date(d.getFullYear(), mi, 1)); setShowMonthPicker(false) }
  const handleYearSelect = (y: number) => { setCurrentDate(d => new Date(y, d.getMonth(), 1)); setShowYearPicker(false) }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const t = new Date()
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear()
  }

  const monthDays = getDaysInMonth(currentDate)

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{project.name}</h1>
          <p className="text-secondary">{project.description}</p>
        </div>
        <div className="relative" ref={pickerRef}>
          <button onClick={() => setIsPickerOpen(v => !v)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface border border-secondary/20">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'Set due date'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {isPickerOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-secondary/10 rounded-lg shadow-lg p-3 z-10">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => navigateMonth(-1)}><ChevronLeft className="w-5 h-5"/></button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowMonthPicker(v => !v)} className="px-2 py-1 rounded hover:bg-board">{currentDate.toLocaleString('default', { month: 'long' })}</button>
                  <button onClick={() => setShowYearPicker(v => !v)} className="px-2 py-1 rounded hover:bg-board">{currentDate.getFullYear()}</button>
                </div>
                <button onClick={() => navigateMonth(1)}><ChevronRight className="w-5 h-5"/></button>
              </div>
              {showMonthPicker ? (
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m, i) => (
                    <button key={m} className="px-2 py-1 rounded hover:bg-board" onClick={() => handleMonthSelect(i)}>{m}</button>
                  ))}
                </div>
              ) : showYearPicker ? (
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {years.map((y) => (
                    <button key={y} className="px-2 py-1 rounded hover:bg-board" onClick={() => handleYearSelect(y)}>{y}</button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 text-xs text-secondary px-1">
                    {weekdays.map((w) => (<div key={w} className="text-center">{w}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mt-1">
                    {monthDays.map((d, i) => (
                      <button key={i} disabled={!d} onClick={() => d && handleDaySelect(d)} className={`h-8 rounded text-sm ${d ? 'hover:bg-board' : 'opacity-0'} ${isToday(d) ? 'ring-1 ring-accent' : ''} ${isSelected(d) ? 'bg-accent text-white' : ''}`}>{d ? d.getDate() : ''}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button onClick={handleSetToday} className="text-sm px-2 py-1 rounded hover:bg-board">Today</button>
                    <button onClick={handleRemoveDate} className="inline-flex items-center gap-1 text-red-600 text-sm"><X className="w-4 h-4"/>Remove</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}