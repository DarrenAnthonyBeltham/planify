import { useState } from "react"
import { Save } from "lucide-react"

export default function TitleEditor({
  value,
  onSave,
}: {
  value: string
  onSave: (next: string) => Promise<void> | void
}) {
  const [title, setTitle] = useState(value)
  const [saving, setSaving] = useState(false)

  return (
    <div className="flex items-start gap-3">
      <input
        className="w-full text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-accent text-primary"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded-md disabled:opacity-60"
        disabled={saving || title.trim() === ""}
        onClick={async () => {
          setSaving(true)
          await onSave(title.trim())
          setSaving(false)
        }}
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  )
}