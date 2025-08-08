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
        const users = await searchUsers(q)
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
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full py-2 px-3 text-primary bg-background border border-secondary/20 rounded-lg"
        placeholder="Search by name or email..."
        autoFocus
      />
      <div className="mt-4 max-h-60 overflow-y-auto">
        {loading && <p className="text-secondary text-center">Searching...</p>}
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-board">
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full"
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                alt={user.name}
              />
              <span className="text-primary">{user.name}</span>
            </div>
            <button
              onClick={() => onAddMember(user)}
              className="text-sm bg-accent text-white px-3 py-1 rounded-md"
            >
              Add
            </button>
          </div>
        ))}
        {!loading && results.length === 0 && searchTerm.trim() !== '' && (
          <p className="text-secondary text-center">No users found.</p>
        )}
      </div>
    </Modal>
  )
}
