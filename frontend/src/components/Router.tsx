import { useState, useEffect } from 'react'
import { HomePage } from '../pages/Homepage'
import { ProjectPage } from '../pages/ProjectPage'
import { MyTasksPage } from '../pages/MyTasksPage'
import { LoginPage } from '../pages/LoginPage'

export function Router() {
  const [hash, setHash] = useState(window.location.hash || '#/')

  useEffect(() => {
    const h = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  const path = (hash || '#/').replace(/^#\/?/, '')
  const parts = path.split('/')

  if (!parts[0] || parts[0] === '') return <HomePage />
  if (parts[0] === 'login') return <LoginPage />
  if (parts[0] === 'mytasks') return <MyTasksPage />
  if (parts[0] === 'project' && parts[1]) return <ProjectPage projectId={parts[1]} />
  return <HomePage />
}
