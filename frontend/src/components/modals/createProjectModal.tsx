import { useState, useEffect, useRef } from 'react'
import { Modal } from './modal'
import { searchUsers, createProject } from '../../api'
import { X, Calendar, ChevronLeft } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns'

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: { isOpen: boolean; onClose: () => void; onProjectCreated: (newProject: any) => void }) {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [team, setTeam] = useState<any[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDatePickerOpen, setDatePickerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([])
      return
    }
    const handler = setTimeout(() => {
      searchUsers(searchTerm).then(users => {
        const ids = new Set(team.map(t => t.id))
        setSearchResults(users.filter((u: any) => !ids.has(u.id)))
      })
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, team])

  const handleAddMember = (user: any) => {
    if (team.some(m => m.id === user.id)) return
    setTeam([...team, user])
    setSearchTerm('')
    setSearchResults([])
  }

  const handleRemoveMember = (userId: number) => {
    setTeam(team.filter(u => u.id !== userId))
  }

  const handleCreateProject = async () => {
    setIsCreating(true)
    const projectData = {
      name: projectName,
      description,
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      teamIds: team.map(t => t.id)
    }
    try {
      const newProject = await createProject(projectData)
      onProjectCreated(newProject)
      handleClose()
    } finally {
      setIsCreating(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date)
    setDatePickerOpen(false)
  }

  const resetState = () => {
    setStep(1)
    setProjectName('')
    setDescription('')
    setTeam([])
    setDueDate(undefined)
    setSearchTerm('')
    setSearchResults([])
    setIsCreating(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 1 ? 'Create New Project' : 'Add Details'}>
      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)} className="absolute top-4 left-4 text-secondary hover:text-primary">
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="mt-4">
        {step === 1 && (
          <div className="space-y-4">
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project Name" className="w-full p-2 rounded-md bg-board border border-secondary/20 text-primary" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project Description (optional)" className="w-full p-2 rounded-md bg-board border border-secondary/20 text-primary" rows={4} />
            <button onClick={() => setStep(2)} disabled={!projectName} className="w-full bg-accent text-white font-semibold py-2 rounded-lg disabled:opacity-50">Continue</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary mb-2">Add Team Members</h4>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="w-full p-2 rounded-md bg-board border border-secondary/20 text-primary" />
              <div className="mt-2 max-h-32 overflow-y-auto">
                {searchResults.map(user => (
                  <div key={user.id} onClick={() => handleAddMember(user)} className="flex items-center gap-2 p-2 rounded-md hover:bg-board cursor-pointer">
                    <img className="w-8 h-8 rounded-full" src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} />
                    <span className="text-primary">{user.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {team.map(member => (
                  <div key={member.id} className="flex items-center gap-2 bg-board p-1 rounded-full">
                    <img className="w-6 h-6 rounded-full" src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} alt={member.name} />
                    <span className="text-sm text-primary">{member.name}</span>
                    <button onClick={() => handleRemoveMember(member.id)} className="text-secondary hover:text-primary"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <h4 className="font-semibold text-primary mb-2">Set a Deadline (optional)</h4>
              <button onClick={() => setDatePickerOpen(true)} className="flex items-center gap-2 p-2 rounded-md bg-board border border-secondary/20 text-primary w-full">
                <Calendar size={16} className="text-accent"/>
                <span>{dueDate ? format(dueDate, 'PPP') : 'Select a date'}</span>
              </button>
              {isDatePickerOpen && (
                <div ref={pickerRef} className="absolute top-full mt-1 z-50 bg-surface p-2 rounded-md border border-secondary/20 shadow-lg">
                   <DayPicker mode="single" selected={dueDate} onSelect={handleDateSelect} />
                </div>
              )}
            </div>
            <button onClick={handleCreateProject} disabled={isCreating || !projectName} className="w-full bg-accent text-white font-semibold py-2 rounded-lg disabled:opacity-50">
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
