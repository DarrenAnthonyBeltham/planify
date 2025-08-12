import { useEffect, useState, useCallback } from 'react'
import { fetchProjectById, updateTaskPosition } from '../api'
import { ProjectHeader } from '../components/board/projectHeader'
import { BoardColumn } from '../components/board/boardColumn'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { TaskCard } from '../components/board/taskCard'

const dropAnimation: DropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }

export function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)

  useEffect(() => {
    fetchProjectById(projectId)
      .then(data => setProject(data))
      .catch(() => setError('Failed to load project data.'))
      .finally(() => setLoading(false))
  }, [projectId])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  const findColumnContainingTask = (taskId: string, proj: any) => {
    if (!proj) return null
    for (const col of proj.columns) {
      if (Array.isArray(col.tasks) && col.tasks.some((task: any) => String(task.id) === taskId)) return col
    }
    return null
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const activeId = String(active.id)
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

    setProject((prev: any) => {
      if (!prev) return null
      const activeColumn = findColumnContainingTask(activeId, prev)
      let overColumn = prev.columns.find((col: any) => String(col.id) === overId) || findColumnContainingTask(overId, prev)
      if (!activeColumn || !overColumn) return prev

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
    const targetColumn = next.columns.find((c: any) => c.tasks?.some((t: any) => String(t.id) === activeId))
    if (targetColumn) {
      const newIndex = targetColumn.tasks.findIndex((t: any) => String(t.id) === activeId)
      try {
        await updateTaskPosition(activeId, String(targetColumn.id), newIndex)
      } catch {
        fetchProjectById(projectId).then(setProject)
      }
    }
    setActiveTask(null)
  }, [project, projectId])

  if (loading) return <div className="p-8 text-center text-secondary">Loading project…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!project) return null

  return (
    <div className="py-8">
      <ProjectHeader project={project} onUpdate={setProject} />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto py-4">
          <SortableContext items={(project.columns || []).map((c: any) => c.id)}>
            {(project.columns || []).map((col: any) => (
              <BoardColumn key={col.id} column={col} onAddTask={() => {}} />
            ))}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  )
}