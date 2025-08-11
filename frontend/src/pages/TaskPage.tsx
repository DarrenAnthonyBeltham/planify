import { useEffect, useState } from "react"
import {
  fetchTaskById,
  updateTaskFields,
  listComments,
  addComment,
  addAssignee,
  addCollaborator,
  uploadAttachment,
  type TaskDetail,
  type TaskComment,
} from "../api"
import { CheckCircle2, Users, ChevronRight, Paperclip, MessageSquare, Plus } from "lucide-react"
import { format } from "date-fns"
import TitleEditor from "../components/task/TitleEditor"
import DueDatePicker from "../components/task/DueDatePicker"
import AddPersonDialog from "../components/AddPersonDialog"

export function TaskPage({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [addingAssignee, setAddingAssignee] = useState(false)
  const [addingCollab, setAddingCollab] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const t = await fetchTaskById(taskId)
      setTask({
        ...t,
        assignees: t.assignees ?? [],
        collaborators: t.collaborators ?? [],
        attachments: t.attachments ?? [],
        comments: t.comments ?? [],
      })
      setComments((t.comments ?? []) as TaskComment[])
      setLoading(false)
    }
    run().catch((e) => {
      setError(e?.message || "Failed to load task")
      setLoading(false)
    })
  }, [taskId])

  if (loading) return <div className="p-8 text-center text-secondary">Loading task…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!task) return <div className="p-8 text-center text-secondary">No task found.</div>

  const done = task.statusName === "Done"

  return (
    <div className="py-6">
      <div className="flex items-center text-sm text-secondary mb-4">
        <a href={`#/project/${task.projectId}`} className="hover:underline">{task.projectName || "Project"}</a>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span>Task</span>
      </div>

      <div className="flex items-start gap-3 mb-4">
        {done && <CheckCircle2 className="mt-1 w-6 h-6 text-green-500" />}
        <div className="flex-1">
          <TitleEditor
            value={task.title}
            onSave={async (next) => {
              const updated = await updateTaskFields(taskId, { title: next })
              setTask({
                ...updated,
                assignees: updated.assignees ?? [],
                collaborators: updated.collaborators ?? [],
                attachments: updated.attachments ?? [],
                comments: updated.comments ?? [],
              })
            }}
          />
          <div className="mt-3">
            <DueDatePicker
              value={task.dueDate}
              onChange={async (next) => {
                const updated = await updateTaskFields(taskId, { dueDate: next })
                setTask({
                  ...updated,
                  assignees: updated.assignees ?? [],
                  collaborators: updated.collaborators ?? [],
                  attachments: updated.attachments ?? [],
                  comments: updated.comments ?? [],
                })
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-secondary mb-2">Description</h3>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-secondary/20 bg-board p-3 text-primary"
              value={task.description ?? ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={async (e) => {
                const updated = await updateTaskFields(taskId, { description: e.target.value })
                setTask({
                  ...updated,
                  assignees: updated.assignees ?? [],
                  collaborators: updated.collaborators ?? [],
                  attachments: updated.attachments ?? [],
                  comments: updated.comments ?? [],
                })
              }}
              placeholder="Describe the task…"
            />
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary">Activity</h3>
              <div className="flex gap-2">
                <input
                  className="px-3 py-2 rounded-md border border-secondary/20 bg-board text-primary"
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  className="px-3 py-2 rounded-md bg-accent text-white"
                  onClick={async () => {
                    const text = newComment.trim()
                    if (!text) return
                    await addComment(taskId, { text })
                    setNewComment("")
                    setComments(await listComments(taskId))
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {(comments?.length ?? 0) === 0 && (
                <div className="flex items-center gap-2 text-secondary text-sm">
                  <MessageSquare className="w-4 h-4" /> No comments yet
                </div>
              )}
              {(comments ?? []).map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20" />
                  <div className="flex-1">
                    <div className="text-sm text-secondary">
                      {c.author?.name ?? "Someone"} • {format(new Date(c.createdAt), "PPp")}
                    </div>
                    <div className="text-primary">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-secondary">Assignee</h3>
              <button className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board" onClick={() => setAddingAssignee(true)}>Change</button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {(task.assignees?.length ?? 0) > 0 ? (
                (task.assignees ?? []).map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20" />
                    <span className="text-primary text-sm">{a.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-secondary text-sm">Unassigned</span>
              )}
            </div>
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2"><Users className="w-4 h-4" /> Collaborators</h3>
              <button className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board" onClick={() => setAddingCollab(true)}>Add</button>
            </div>
            <div className="flex -space-x-2">
              {(task.collaborators?.length ?? 0) > 0 ? (
                (task.collaborators ?? []).map((a) => (
                  <div key={a.id} className="w-8 h-8 rounded-full bg-accent/20 border-2 border-surface" title={a.name} />
                ))
              ) : (
                <span className="text-secondary text-sm">None</span>
              )}
            </div>
          </section>

          <section className="bg-surface border border-secondary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2"><Paperclip className="w-4 h-4" /> Files</h3>
              <label className="text-xs px-2 py-1 rounded-md border border-secondary/20 hover:bg-board cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    await uploadAttachment(taskId, f)
                    const updated = await fetchTaskById(taskId)
                    setTask({
                      ...updated,
                      assignees: updated.assignees ?? [],
                      collaborators: updated.collaborators ?? [],
                      attachments: updated.attachments ?? [],
                      comments: updated.comments ?? [],
                    })
                  }}
                />
                <span className="inline-flex items-center gap-1"><Plus className="w-3 h-3" />Add</span>
              </label>
            </div>
            <div className="space-y-2 text-sm">
              {((task.attachments ?? []).length === 0) && <div className="text-secondary">No files attached</div>}
              {(task.attachments ?? []).map((a) => (
                <a key={a.id} href={a.url} target="_blank" className="block text-primary underline">
                  {a.fileName} • {(a.size / 1024).toFixed(1)} KB
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AddPersonDialog
        open={addingAssignee}
        label="Set assignee"
        placeholder="Type email or username…"
        onSubmit={async (q) => {
          await addAssignee(taskId, q)
          const updated = await fetchTaskById(taskId)
          setTask({
            ...updated,
            assignees: updated.assignees ?? [],
            collaborators: updated.collaborators ?? [],
            attachments: updated.attachments ?? [],
            comments: updated.comments ?? [],
          })
        }}
        onClose={() => setAddingAssignee(false)}
      />

      <AddPersonDialog
        open={addingCollab}
        label="Add collaborator"
        placeholder="Type email or username…"
        onSubmit={async (q) => {
          await addCollaborator(taskId, q)
          const updated = await fetchTaskById(taskId)
          setTask({
            ...updated,
            assignees: updated.assignees ?? [],
            collaborators: updated.collaborators ?? [],
            attachments: updated.attachments ?? [],
            comments: updated.comments ?? [],
          })
        }}
        onClose={() => setAddingCollab(false)}
      />
    </div>
  )
}