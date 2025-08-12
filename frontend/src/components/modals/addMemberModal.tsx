import { useState, useEffect, useRef } from 'react'
import { Modal } from './modal'
import { searchUsers } from '../../api'

export function AddMemberModal({ isOpen, onClose, onAddMember, currentMembers = [] }: any) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setResults([])
      abortRef.current?.abort()
      return
    }
    const handler = setTimeout(async () => {
      const q = searchTerm.trim()
      if (!q) {
        setResults([])
        return
      }
      setLoading(true)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const users = await searchUsers(q, controller.signal)
        const ids = new Set(currentMembers.map((m: any) => m.id))
        setResults(users.filter((u: any) => !ids.has(u.id)))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, isOpen, currentMembers])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member to Project">
      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 mb-3 rounded border border-secondary/20 bg-board text-primary" placeholder="Search by name or email" />
      {loading && <div className="text-sm text-secondary">Searching…</div>}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {results.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between p-2 rounded border border-secondary/10">
            <div className="text-sm">
              <div className="font-medium text-primary">{u.name}</div>
              <div className="text-secondary">{u.email}</div>
            </div>
            <button className="px-3 py-1.5 rounded bg-accent text-white" onClick={() => onAddMember(u)}>Add</button>
          </div>
        ))}
        {!loading && results.length === 0 && searchTerm && (
          <div className="text-sm text-secondary">No results</div>
        )}
      </div>
    </Modal>
  )
}