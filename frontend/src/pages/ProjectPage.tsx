import { useEffect, useState, useCallback } from "react"
import { fetchProjectById, updateTaskPosition, fetchTaskById, createTask } from "../api"
import { ProjectHeader } from "../components/board/projectHeader"
import { BoardColumn } from "../components/board/boardColumn"
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { TaskCard } from "../components/board/taskCard"
import { ArrowLeft } from "lucide-react"

const dropAnimation: DropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  useEffect(() => {
    setLoading(true)
    fetchProjectById(projectId)
      .then(async (data) => {
        setProject(data)
        const cols = Array.isArray(data?.columns) ? data.columns : []
        const tasks = cols.flatMap((c: any) => Array.isArray(c.tasks) ? c.tasks : [])
        if (tasks.length === 0) return
        const updates = await Promise.allSettled(
          tasks.map((t: any) =>
            fetchTaskById(String(t.id)).then(td => ({
              id: t.id,
              commentsCount: td.comments?.length ?? 0,
              attachmentsCount: td.attachments?.length ?? 0,
              priority: td.priority ?? null
            }))
          )
        )
        setProject((prev: any) => {
          if (!prev?.columns) return prev
          const patches = new Map<string, any>()
          for (const u of updates) {
            if (u.status === "fulfilled" && u.value) patches.set(String(u.value.id), u.value)
          }
          return {
            ...prev,
            columns: prev.columns.map((col: any) => ({
              ...col,
              tasks: Array.isArray(col.tasks)
                ? col.tasks.map((t: any) => {
                    const p = patches.get(String(t.id))
                    return p ? { ...t, ...p } : t
                  })
                : []
            }))
          }
        })
      })
      .catch(() => setError("Failed to load project data."))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    function onStats(e: Event) {
      const d: any = (e as CustomEvent).detail
      if (!d?.taskId) return
      setProject((prev: any) => {
        if (!prev?.columns) return prev
        return {
          ...prev,
          columns: prev.columns.map((col: any) => ({
            ...col,
            tasks: Array.isArray(col.tasks)
              ? col.tasks.map((t: any) =>
                  String(t.id) === String(d.taskId)
                    ? {
                        ...t,
                        commentsCount: typeof d.commentsCount === "number" ? d.commentsCount : t.commentsCount,
                        attachmentsCount: typeof d.attachmentsCount === "number" ? d.attachmentsCount : t.attachmentsCount,
                        priority: d.priority !== undefined ? d.priority : t.priority
                      }
                    : t
                )
              : []
          }))
        }
      })
    }
    window.addEventListener("planify:task-stats", onStats as EventListener)
    return () => window.removeEventListener("planify:task-stats", onStats as EventListener)
  }, [])

  const findColumnContainingTask = (taskId: string, proj: any) => {
    if (!proj) return null
    for (const col of proj.columns) if (Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === taskId)) return col
    return null
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id)
    if (project) {
      const task = findColumnContainingTask(activeId, project)?.tasks.find((t: any) => String(t.id) === activeId)
      setActiveTask(task)
    }
  }, [project])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !project) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return
    setProject((prev: any) => {
      if (!prev) return null
      const activeColumn = findColumnContainingTask(activeId, prev)
      let overColumn = prev.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, prev)
      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return prev
      const activeIdx = activeColumn.tasks.findIndex((t: any) => String(t.id) === activeId)
      const [moved] = activeColumn.tasks.splice(activeIdx, 1)
      if (!Array.isArray(overColumn.tasks)) overColumn.tasks = []
      overColumn.tasks.splice(0, 0, moved)
      return { ...prev }
    })
  }, [project])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !project) return
    const activeId = String(active.id)
    const overId = String(over.id)
    let targetStatusId: string | null = null
    setProject((prev: any) => {
      if (!prev) return null
      const activeColumn = findColumnContainingTask(activeId, prev)
      let overColumn = prev.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, prev)
      if (!activeColumn || !overColumn) return prev
      targetStatusId = String(overColumn.id)
      const aIdx = activeColumn.tasks.findIndex((t: any) => String(t.id) === activeId)
      const oIdx = overColumn.tasks.findIndex((t: any) => String(t.id) === activeId)
      if (activeColumn.id === overColumn.id) {
        if (aIdx === -1 || oIdx === -1) return prev
        overColumn.tasks = arrayMove(overColumn.tasks, aIdx, oIdx)
        return { ...prev }
      } else {
        if (aIdx === -1) return prev
        const [moved] = activeColumn.tasks.splice(aIdx, 1)
        overColumn.tasks.splice(oIdx === -1 ? 0 : oIdx, 0, moved)
        return { ...prev }
      }
    })
    const next = project
    const column = next.columns.find((c: any) => c.tasks?.some((t: any) => String(t.id) === activeId))
    if (column && targetStatusId) {
      const newIndex = column.tasks.findIndex((t: any) => String(t.id) === activeId)
      try { await updateTaskPosition(activeId, targetStatusId, newIndex) }
      catch { fetchProjectById(projectId).then(setProject) }
    }
    setActiveTask(null)
  }, [project, projectId])

  const handleAddTask = useCallback(async (statusId: string | number, title: string) => {
    const created = await createTask(Number(projectId), Number(statusId), title)
    setProject((prev: any) => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map((c: any) =>
          String(c.id) === String(statusId)
            ? {
                ...c,
                tasks: [
                  {
                    id: created.id,
                    title: created.title,
                    position: created.position,
                    statusId: created.statusId,
                    commentsCount: created.commentsCount ?? 0,
                    attachmentsCount: created.attachmentsCount ?? 0,
                    priority: created.priority ?? null
                  },
                  ...(c.tasks || [])
                ]
              }
            : c
        )
      }
    })
  }, [projectId])

  if (loading) return <div className="p-8 text-center text-secondary">Loading project…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!project) return null

  return (
    <div className="py-8">
      <div className="mb-4">
        <a href="#/" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>
      </div>
      <ProjectHeader project={project} onUpdate={setProject} />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto py-4">
          <SortableContext items={(project.columns || []).map((c: any) => c.id)}>
            {(project.columns || []).map((col: any) => (
              <BoardColumn key={col.id} column={col} onAddTask={handleAddTask} />
            ))}
          </SortableContext>
        </div>
        {createPortal(<DragOverlay dropAnimation={dropAnimation}>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>, document.body)}
      </DndContext>
    </div>
  )
}