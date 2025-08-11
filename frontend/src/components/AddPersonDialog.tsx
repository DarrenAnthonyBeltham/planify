import { useEffect, useRef, useState } from "react"
import { Modal } from "./modals/modal"

export default function AddPersonDialog({
  open,
  label,
  placeholder,
  onSubmit,
  onClose,
}: {
  open: boolean
  label: string
  placeholder: string
  onSubmit: (query: string) => Promise<void> | void
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  return (
    <Modal isOpen={open} onClose={onClose} title={label}>
      <div className="space-y-3">
        <input
          ref={inputRef}
          className="w-full px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded-md border border-secondary/20" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-md bg-accent text-white disabled:opacity-50"
            disabled={!q.trim()}
            onClick={async () => {
              await onSubmit(q.trim())
              setQ("")
              onClose()
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}